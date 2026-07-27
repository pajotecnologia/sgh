// app/api/atendimento/[atendimentoId]/encaminhamento/route.ts
// GET — Lista encaminhamentos | POST — Novo encaminhamento

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { schemaEncaminhamento } from '@/lib/validations/atendimento';
import { prontuarioPertenceAoAtendimento, prontuarioEstaEncerrado } from '@/lib/atendimento-prontuario';

const ROLES_MEDICO = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'] as const;
const ROLES_LEITURA = [...ROLES_MEDICO, 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!ROLES_LEITURA.includes(sessao.usuario.role as (typeof ROLES_LEITURA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  const prontuario = await prisma.prontuarioMedico.findUnique({
    where: { atendimentoId },
    include: {
      encaminhamentos: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!prontuario) {
    return NextResponse.json({ sucesso: true, dados: [] });
  }

  return NextResponse.json({ sucesso: true, dados: prontuario.encaminhamentos });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!ROLES_MEDICO.includes(sessao.usuario.role as (typeof ROLES_MEDICO)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  try {
    if (await prontuarioEstaEncerrado(atendimentoId)) {
      return NextResponse.json({ sucesso: false, erro: 'Prontuário encerrado. Edição não permitida.' }, { status: 409 })
    }

    const body = await req.json();
    const validacao = schemaEncaminhamento.safeParse(body);
    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const d = validacao.data;
    const ok = await prontuarioPertenceAoAtendimento(atendimentoId, d.prontuarioId);
    if (!ok) {
      return NextResponse.json({ sucesso: false, erro: 'Prontuário inválido para este atendimento.' }, { status: 400 });
    }

    if (d.tipo === 'EXTERNO' || d.tipo === 'INTERNACAO') {
      const j = d.justificativa?.trim();
      if (!j || j.length < 5) {
        return NextResponse.json(
          { sucesso: false, erro: 'Justificativa obrigatória (mín. 5 caracteres) para este tipo de encaminhamento.' },
          { status: 400 }
        );
      }
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const atendimentoAntes = await tx.atendimento.findUnique({
        where: { id: atendimentoId },
        select: { status: true },
      });

      const criado = await tx.encaminhamento.create({
        data: {
          prontuarioId: d.prontuarioId,
          tipo: d.tipo,
          especialidade: d.especialidade,
          medicoDestinoId: d.medicoDestinoId ?? null,
          prioridade: d.prioridade ?? null,
          resumoClinco: d.resumoClinco?.trim() || null,
          justificativa: d.justificativa?.trim() || null,
          cidInternacao: d.cidInternacao?.trim() || null,
        },
      });

      await tx.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'CRIACAO',
          entidade: 'Encaminhamento',
          entidadeId: criado.id,
          valorNovo: `${d.tipo} — ${d.especialidade}`,
          ipOrigem: req.headers.get('x-forwarded-for') ?? null,
        },
      });

      // Desfecho do atendimento conforme o tipo de encaminhamento:
      // INTERNACAO -> aguarda recepção da enfermagem (Admissões); EXTERNO -> finaliza o atendimento.
      const statusNovo =
        d.tipo === 'INTERNACAO' ? 'AGUARDANDO_INTERNACAO' : d.tipo === 'EXTERNO' ? 'CONCLUIDO' : null;

      if (statusNovo) {
        // Encerra o prontuário médico do PS (alta, externo ou encaminhamento para internação).
        if (statusNovo === 'CONCLUIDO' || statusNovo === 'AGUARDANDO_INTERNACAO') {
          await tx.prontuarioMedico.update({
            where: { id: d.prontuarioId },
            data: { encerradoEm: new Date(), encerradoPorId: sessao.usuario.id },
          });
        }

        await tx.atendimento.update({
          where: { id: atendimentoId },
          data: { status: statusNovo },
        });

        if (atendimentoAntes?.status && atendimentoAntes.status !== statusNovo) {
          await tx.logAuditoria.create({
            data: {
              usuarioId: sessao.usuario.id,
              acao: 'ATUALIZACAO',
              entidade: 'Atendimento',
              entidadeId: atendimentoId,
              valorAnterior: atendimentoAntes.status,
              valorNovo: statusNovo,
              ipOrigem: req.headers.get('x-forwarded-for') ?? null,
            },
          });
        }
      }

      return { criado, statusNovo };
    });

    return NextResponse.json(
      { sucesso: true, dados: resultado.criado, meta: { statusNovo: resultado.statusNovo } },
      { status: 201 }
    );
  } catch (erro) {
    console.error('[POST encaminhamento]', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
