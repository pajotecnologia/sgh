// app/api/atendimentos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StatusAtendimento } from '@prisma/client';
import { gerarNumeroAtendimento } from '@/lib/attendance';
import { dispararEventoPusher, CANAIS_PUSHER, EVENTOS_PUSHER } from '@/lib/pusher';
import type { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  // Verificar autenticação
  const sessao = await getServerSession(authOptions);
  if (!sessao) {
    return NextResponse.json<ApiResponse<never>>(
      { sucesso: false, erro: 'Não autorizado.' },
      { status: 401 }
    );
  }

  const rolesPermitidos = ['ADMIN', 'RECEPCIONISTA'];
  if (!rolesPermitidos.includes(sessao.usuario.role)) {
    return NextResponse.json<ApiResponse<never>>(
      { sucesso: false, erro: 'Sem permissão para criar atendimentos.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { pacienteId, origemId } = body;

    if (!pacienteId) {
      return NextResponse.json<ApiResponse<never>>(
        { sucesso: false, erro: 'ID do paciente é obrigatório.' },
        { status: 400 }
      );
    }

    // Verificar se o paciente existe
    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId },
      select: { id: true, nomeExibicao: true }
    });

    if (!paciente) {
      return NextResponse.json<ApiResponse<never>>(
        { sucesso: false, erro: 'Paciente não encontrado.' },
        { status: 404 }
      );
    }

    // Verificar se já tem atendimento ativo
    const atendimentoAberto = await prisma.atendimento.findFirst({
      where: {
        pacienteId,
        status: {
          in: [
            StatusAtendimento.AGUARDANDO_TRIAGEM,
            StatusAtendimento.EM_TRIAGEM,
            StatusAtendimento.AGUARDANDO_ATENDIMENTO,
            StatusAtendimento.EM_ATENDIMENTO,
            StatusAtendimento.INTERNADO
          ]
        },
        deletedAt: null
      }
    });

    if (atendimentoAberto) {
      return NextResponse.json<ApiResponse<never>>(
        { sucesso: false, erro: 'Este paciente já possui um atendimento ativo.' },
        { status: 409 }
      );
    }

    const numeroAtendimento = gerarNumeroAtendimento();

    // Criar atendimento e registrar log
    const atendimento = await prisma.$transaction(async (tx) => {
      const novoAtendimento = await tx.atendimento.create({
        data: {
          pacienteId,
          origemId: origemId || null,
          numeroAtendimento,
          status: StatusAtendimento.AGUARDANDO_TRIAGEM,
        },
      });

      await tx.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'CRIACAO',
          entidade: 'Atendimento',
          entidadeId: novoAtendimento.id,
          ipOrigem: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
          userAgent: req.headers.get('user-agent'),
        },
      });

      return novoAtendimento;
    });

    // Notificar painel de triagem
    dispararEventoPusher(CANAIS_PUSHER.filaTriagem, EVENTOS_PUSHER.FILA_ATUALIZADA, {
      acao: 'NOVO_ATENDIMENTO',
      atendimentoId: atendimento.id,
      paciente: paciente.nomeExibicao,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiResponse<typeof atendimento>>(
      { sucesso: true, dados: atendimento, mensagem: 'Atendimento criado com sucesso.' },
      { status: 201 }
    );
  } catch (erro: any) {
    console.error('[POST /api/atendimentos] ERRO:', erro);
    return NextResponse.json<ApiResponse<never>>(
      { 
        sucesso: false, 
        erro: 'Erro interno ao criar atendimento.',
        detalhes: process.env.NODE_ENV === 'development' ? erro.message : undefined
      },
      { status: 500 }
    );
  }
}
