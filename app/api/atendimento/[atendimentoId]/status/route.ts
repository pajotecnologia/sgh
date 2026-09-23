import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StatusAtendimento } from '@prisma/client';
import { statusExigeLeito, statusFinaisInternacao, transicaoAtendimentoPermitida } from '@/lib/fluxo-atendimento';

const ROLES_STATUS = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!ROLES_STATUS.includes(sessao.usuario.role)) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão para alterar o fluxo clínico.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const status = body?.status as StatusAtendimento;
    if (!Object.values(StatusAtendimento).includes(status)) {
      return NextResponse.json({ sucesso: false, erro: 'Status inválido.' }, { status: 400 });
    }

    const atendimento = await prisma.atendimento.findFirst({
      where: { id: atendimentoId, deletedAt: null },
      select: { id: true, status: true, leitoId: true, medicoId: true },
    });
    if (!atendimento) return NextResponse.json({ sucesso: false, erro: 'Atendimento não encontrado.' }, { status: 404 });
    if (!transicaoAtendimentoPermitida(atendimento.status, status)) {
      return NextResponse.json({ sucesso: false, erro: `Transição não permitida: ${atendimento.status} → ${status}.` }, { status: 409 });
    }
    if (statusExigeLeito(status) && !atendimento.leitoId) {
      return NextResponse.json({ sucesso: false, erro: 'Informe um leito antes de colocar o paciente como internado.' }, { status: 409 });
    }

    const ipOrigem = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip');
    const userAgent = req.headers.get('user-agent');

    const atualizado = await prisma.$transaction(async (tx) => {
      if (statusExigeLeito(status) && atendimento.leitoId) {
        const leito = await tx.leito.findUnique({ where: { id: atendimento.leitoId }, select: { status: true, ativo: true } });
        if (!leito?.ativo || leito.status !== 'DISPONIVEL') {
          throw new Error('LEITO_INDISPONIVEL');
        }
        await tx.leito.update({ where: { id: atendimento.leitoId }, data: { status: 'OCUPADO' } });
      }

      if (statusFinaisInternacao(status) && atendimento.leitoId) {
        await tx.leito.updateMany({ where: { id: atendimento.leitoId, status: 'OCUPADO' }, data: { status: 'DISPONIVEL' } });
      }

      if (status === 'CONCLUIDO' || status === 'AGUARDANDO_INTERNACAO') {
        await tx.prontuarioMedico.updateMany({ where: { atendimentoId }, data: { encerradoEm: new Date(), encerradoPorId: sessao.usuario.id } });
      }

      const atualizado = await tx.atendimento.update({
        where: { id: atendimentoId },
        data: {
          status,
          ...(status === 'EM_ATENDIMENTO' ? { medicoId: sessao.usuario.id } : {}),
          ...(statusFinaisInternacao(status) ? { leitoId: null } : {}),
        },
      });

      await tx.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'ATUALIZACAO',
          entidade: 'Atendimento',
          entidadeId: atendimentoId,
          campo: 'status',
          valorAnterior: atendimento.status,
          valorNovo: status,
          ipOrigem,
          userAgent,
        },
      });
      return atualizado;
    });

    return NextResponse.json({ sucesso: true, dados: atualizado });
  } catch (erro) {
    if (erro instanceof Error && erro.message === 'LEITO_INDISPONIVEL') {
      return NextResponse.json({ sucesso: false, erro: 'O leito selecionado não está disponível.' }, { status: 409 });
    }
    console.error('[POST /api/atendimento/status]', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao atualizar status.' }, { status: 500 });
  }
}
