// app/api/painel/chamar/route.ts
// POST /api/painel/chamar — Chamar paciente para atendimento (emite evento Pusher)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { schemaChamarPaciente } from '@/lib/validations/triagem';
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao';
import { dispararEventoPusher, CANAIS_PUSHER, EVENTOS_PUSHER } from '@/lib/pusher';
import type { ApiResponse, ChamadaPainelDTO } from '@/types';

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  }

  if (!['ADMIN', 'ENFERMEIRO', 'MEDICO', 'DIRETOR_CLINICO'].includes(sessao.usuario.role)) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validacao = schemaChamarPaciente.safeParse(body);

    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { atendimentoId, salaDestino, setorPainel } = validacao.data;

    // Buscar dados do atendimento
    const atendimento = await prisma.atendimento.findFirst({
      where: { id: atendimentoId, deletedAt: null },
      include: {
        paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
        triagem: { select: { corClassificacao: true } },
      },
    });

    if (!atendimento) {
      return NextResponse.json({ sucesso: false, erro: 'Atendimento não encontrado.' }, { status: 404 });
    }

    // Registrar chamada no banco
    const chamada = await prisma.$transaction(async (tx) => {
      const novaChamada = await tx.chamadaPainel.create({
        data: {
          atendimentoId,
          chamadoPorId: sessao.usuario.id,
          salaDestino,
          setorPainel,
        },
      });

      let novoStatus = atendimento.status;
      if (atendimento.status === 'AGUARDANDO_TRIAGEM') novoStatus = 'EM_TRIAGEM';
      else if (atendimento.status === 'AGUARDANDO_ATENDIMENTO') novoStatus = 'EM_ATENDIMENTO';

      // Atualizar sala do atendimento
      await tx.atendimento.update({
        where: { id: atendimentoId },
        data: { sala: salaDestino, status: novoStatus },
      });

      await tx.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'CHAMADA_PAINEL',
          entidade: 'ChamadaPainel',
          entidadeId: novaChamada.id,
          valorNovo: `Sala: ${salaDestino}`,
          ipOrigem: req.headers.get('x-forwarded-for') ?? null,
        },
      });

      return novaChamada;
    });

    const nomePacientePainel = nomeCompletoParaExibicao(
      atendimento.paciente.nomeExibicao,
      atendimento.paciente.nomeCriptografado
    );

    // Montar DTO para o painel
    const payload: ChamadaPainelDTO = {
      id: chamada.id,
      nomePaciente: nomePacientePainel,
      numeroAtendimento: atendimento.numeroAtendimento,
      salaDestino,
      corTriagem: atendimento.triagem?.corClassificacao ?? undefined,
      chamadoEm: chamada.chamadoEm,
      setorPainel,
    };

    // Emitir evento WebSocket para o painel de chamada (noop se Pusher não configurado)
    dispararEventoPusher(CANAIS_PUSHER.painel(setorPainel), EVENTOS_PUSHER.CHAMADA_PACIENTE, {
      chamada: payload,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiResponse<ChamadaPainelDTO>>(
      { sucesso: true, dados: payload, mensagem: 'Paciente chamado com sucesso.' },
      { status: 201 }
    );
  } catch (erro) {
    console.error('[POST /api/painel/chamar] Erro:', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
