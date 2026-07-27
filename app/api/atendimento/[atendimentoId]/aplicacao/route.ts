// app/api/atendimento/[atendimentoId]/aplicacao/route.ts
// POST — Registrar aplicação de medicamento (enfermagem)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { schemaAplicacaoMedicamento } from '@/lib/validations/atendimento';
import { STATUS_MEDICACAO_ATIVOS } from '@/lib/fila-medicacao';

const ROLES_APLICAR = ['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!ROLES_APLICAR.includes(sessao.usuario.role as (typeof ROLES_APLICAR)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validacao = schemaAplicacaoMedicamento.safeParse(body);
    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { itemPrescricaoId, doseAplicada, via, checklistConfirmado, observacoes, contexto } =
      validacao.data;

    const item = await prisma.itemPrescricao.findFirst({
      where: { id: itemPrescricaoId },
      include: {
        prescricao: {
          select: { tipo: true, prontuario: { select: { atendimentoId: true } } },
        },
      },
    });

    if (!item || item.prescricao.prontuario.atendimentoId !== atendimentoId) {
      return NextResponse.json({ sucesso: false, erro: 'Item de prescrição não pertence a este atendimento.' }, { status: 404 });
    }

    if (item.prescricao.tipo === 'RECEITA_ALTA') {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Este item pertence à receita de alta (uso em casa), não à aplicação pela enfermagem.',
        },
        { status: 409 }
      );
    }

    const atendimento = await prisma.atendimento.findFirst({
      where: { id: atendimentoId, deletedAt: null },
      select: { status: true },
    });
    if (!atendimento) {
      return NextResponse.json({ sucesso: false, erro: 'Atendimento não encontrado.' }, { status: 404 });
    }
    if (contexto === 'medicacao') {
      if (atendimento.status === 'INTERNADO') {
        return NextResponse.json(
          {
            sucesso: false,
            erro: 'Paciente internado: aplique a medicação no prontuário em Internação (aba Instruções / Enfermagem).',
          },
          { status: 403 }
        );
      }
      if (!STATUS_MEDICACAO_ATIVOS.includes(atendimento.status)) {
        return NextResponse.json(
          {
            sucesso: false,
            erro: 'Este atendimento não está elegível para aplicação no módulo Medicação.',
          },
          { status: 403 }
        );
      }
    } else {
      if (atendimento.status !== 'INTERNADO') {
        return NextResponse.json(
          {
            sucesso: false,
            erro: 'Aplicação no prontuário da internação permitida somente para pacientes internados.',
          },
          { status: 403 }
        );
      }
    }

    if (item.status === 'RECUSADO' || item.status === 'SUSPENSO') {
      return NextResponse.json({ sucesso: false, erro: 'Item não pode receber aplicação neste status.' }, { status: 409 });
    }

    const aplicadoEm = new Date();
    const primeiraDose = item.status === 'PENDENTE';

    const aplicacao = await prisma.$transaction(async (tx) => {
      const a = await tx.aplicacaoMedicamento.create({
        data: {
          itemPrescricaoId,
          aplicadoPorId: sessao.usuario.id,
          doseAplicada,
          via,
          aplicadoEm,
          checklistConfirmado: checklistConfirmado as object,
          observacoes: observacoes?.trim() || null,
        },
        include: { aplicadoPor: { select: { nome: true } } },
      });

      if (primeiraDose) {
        await tx.itemPrescricao.update({
          where: { id: itemPrescricaoId },
          data: { status: 'APLICADO' },
        });
      }

      await tx.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'CRIACAO',
          entidade: 'AplicacaoMedicamento',
          entidadeId: a.id,
          valorNovo: doseAplicada,
          ipOrigem: req.headers.get('x-forwarded-for') ?? null,
        },
      });

      return a;
    });

    return NextResponse.json(
      {
        sucesso: true,
        dados: {
          id: aplicacao.id,
          aplicadoEm: aplicacao.aplicadoEm,
          aplicadoPor: aplicacao.aplicadoPor,
        },
      },
      { status: 201 }
    );
  } catch (erro) {
    console.error('[POST aplicacao]', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
