// PATCH — Lançar ou atualizar resultado de um item de requisição de exames

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { schemaAtualizarItemExame } from '@/lib/validations/atendimento';
import { prontuarioEstaEncerrado } from '@/lib/atendimento-prontuario'

const ROLES = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string; itemId: string }> }
) {
  const { atendimentoId, itemId } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  try {
    if (await prontuarioEstaEncerrado(atendimentoId)) {
      return NextResponse.json({ sucesso: false, erro: 'Prontuário encerrado. Edição não permitida.' }, { status: 409 })
    }

    const body = await req.json();
    const validacao = schemaAtualizarItemExame.safeParse(body);
    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { resultado, realizadoEm } = validacao.data;
    const raw = realizadoEm?.trim() ?? '';
    const quando = raw ? new Date(raw) : new Date();
    if (Number.isNaN(quando.getTime())) {
      return NextResponse.json({ sucesso: false, erro: 'Data/hora de realização inválida.' }, { status: 400 });
    }

    const item = await prisma.itemRequisicao.findFirst({
      where: { id: itemId },
      include: {
        requisicao: {
          include: {
            prontuario: { select: { atendimentoId: true } },
          },
        },
      },
    });

    if (!item || item.requisicao.prontuario.atendimentoId !== atendimentoId) {
      return NextResponse.json({ sucesso: false, erro: 'Item não encontrado neste atendimento.' }, { status: 404 });
    }

    const atualizado = await prisma.itemRequisicao.update({
      where: { id: itemId },
      data: {
        resultado: resultado.trim(),
        realizadoEm: quando,
      },
    });

    await prisma.logAuditoria.create({
      data: {
        usuarioId: sessao.usuario.id,
        acao: 'ATUALIZACAO',
        entidade: 'ItemRequisicao',
        entidadeId: itemId,
        valorNovo: `Resultado exame (${item.nomeExame})`,
        ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      },
    });

    return NextResponse.json({
      sucesso: true,
      dados: {
        id: atualizado.id,
        resultado: atualizado.resultado,
        resultadoPdf: atualizado.resultadoPdf,
        realizadoEm: atualizado.realizadoEm,
      },
    });
  } catch (erro) {
    console.error('[PATCH exames/item]', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
