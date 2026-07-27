// app/api/atendimento/[atendimentoId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StatusAtendimento } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });

  try {
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ sucesso: false, erro: 'Status não informado.' }, { status: 400 });
    }

    // Apenas médicos e admins podem mudar status nesta etapa
    if (!['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'].includes(sessao.usuario.role)) {
      return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
    }

    const atendimento = await prisma.atendimento.findUnique({
      where: { id: atendimentoId },
      select: { status: true, leitoId: true }
    });

    if (!atendimento) {
      return NextResponse.json({ sucesso: false, erro: 'Atendimento não encontrado.' }, { status: 404 });
    }

    // Atualizar status e registrar log
    const atualizado = await prisma.$transaction(async (tx) => {
      // Se for alta/transferência/óbito, liberar leito (se houver)
      const finalizaInternacao = ['ALTA', 'TRANSFERIDO', 'OBITO'].includes(String(status));
      if (finalizaInternacao && atendimento.leitoId) {
        await tx.leito.updateMany({
          where: { id: atendimento.leitoId, status: 'OCUPADO' },
          data: { status: 'DISPONIVEL' },
        });
      }

      // Encerra o prontuário médico do PS (alta ou encaminhamento para internação).
      if (String(status) === 'CONCLUIDO' || String(status) === 'AGUARDANDO_INTERNACAO') {
        await tx.prontuarioMedico.upsert({
          where: { atendimentoId },
          create: { atendimentoId, encerradoEm: new Date(), encerradoPorId: sessao.usuario.id },
          update: { encerradoEm: new Date(), encerradoPorId: sessao.usuario.id },
        })
      }

      const a = await tx.atendimento.update({
        where: { id: atendimentoId },
        data: { 
          status: status as StatusAtendimento,
          // Se for finalização, podemos registrar quem finalizou
          ...(status === 'EM_ATENDIMENTO' ? { medicoId: sessao.usuario.id } : {}),
          ...(finalizaInternacao ? { leitoId: null } : {}),
        }
      });

      await tx.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'ATUALIZACAO',
          entidade: 'Atendimento',
          entidadeId: atendimentoId,
          valorAnterior: atendimento.status,
          valorNovo: status,
          ipOrigem: req.headers.get('x-forwarded-for') ?? null,
        }
      });

      return a;
    });

    return NextResponse.json({ sucesso: true, dados: atualizado });
  } catch (erro: any) {
    console.error('[POST /api/atendimento/status]', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao atualizar status.' }, { status: 500 });
  }
}
