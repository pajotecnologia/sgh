// app/api/triagem/route.ts - FINAL REFORCE RELOAD
// POST /api/triagem — Registrar triagem de um atendimento

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { schemaRegistrarTriagem } from '@/lib/validations/triagem';
import { dispararEventoPusher, CANAIS_PUSHER, EVENTOS_PUSHER } from '@/lib/pusher';
import { calcularImc } from '@/lib/utils';
import type { ApiResponse } from '@/types';
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao';
import { estadoConscienciaSinaisKeysToCsv } from '@/lib/triagem-estado-consciencia-sinais';

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) {
    return NextResponse.json<ApiResponse<never>>(
      { sucesso: false, erro: 'Não autorizado.' },
      { status: 401 }
    );
  }

  // Apenas enfermeiros e admins podem realizar triagem
  if (!['ADMIN', 'ENFERMEIRO'].includes(sessao.usuario.role)) {
    return NextResponse.json<ApiResponse<never>>(
      { sucesso: false, erro: 'Sem permissão para realizar triagem.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validacao = schemaRegistrarTriagem.safeParse(body);

    if (!validacao.success) {
      return NextResponse.json<ApiResponse<never>>(
        {
          sucesso: false,
          erro: 'Dados inválidos.',
          detalhes: validacao.error.flatten().fieldErrors as Record<string, string[]>,
        },
        { status: 400 }
      );
    }

    const {
      atendimentoId, corClassificacao, queixaPrincipal, categoriaQueixa, sinaisVitais,
      doencasPreexistentes, medicacoes, alergias, acidenteTrabalho, regraDor,
      tipoDorToracica, irradiacao, tempoQueixa, fluxograma, discriminador, especialidade,
      duracaoDor, localizacaoDor, irradiacaoDorSites, estadoConscienciaSinais,
    } = validacao.data;

    // Verificar se o atendimento existe e está aguardando triagem
    const atendimento = await prisma.atendimento.findFirst({
      where: { id: atendimentoId, deletedAt: null },
      include: {
        paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
        triagem: { select: { id: true } },
      },
    });

    if (!atendimento) {
      return NextResponse.json<ApiResponse<never>>(
        { sucesso: false, erro: 'Atendimento não encontrado.' },
        { status: 404 }
      );
    }

    if (atendimento.triagem) {
      return NextResponse.json<ApiResponse<never>>(
        { sucesso: false, erro: 'Este atendimento já foi triado.' },
        { status: 409 }
      );
    }

    // Calcular IMC automaticamente se peso e altura fornecidos
    let imcCalculado: number | undefined;
    if (sinaisVitais.peso && sinaisVitais.altura) {
      imcCalculado = calcularImc(sinaisVitais.peso, sinaisVitais.altura).imc;
    }

    // Criar triagem + sinais vitais + atualizar status do atendimento em transação
    const triagem = await prisma.$transaction(async (tx) => {
      const novaTriagem = await tx.triagem.create({
        data: {
          atendimentoId,
          triadorId: sessao.usuario.id,
          corClassificacao,
          queixaPrincipal,
          categoriaQueixa: categoriaQueixa || null,
          doencasPreexistentes: doencasPreexistentes || null,
          medicacoes: medicacoes || null,
          alergias: alergias || null,
          acidenteTrabalho: acidenteTrabalho || false,
          regraDor: regraDor || null,
          nivelConsciencia: null,
          ritmo: null,
          tipoDorToracica: tipoDorToracica || null,
          irradiacao: irradiacao || null,
          duracaoDor: duracaoDor?.trim() || null,
          localizacaoDor: localizacaoDor?.trim() || null,
          irradiacaoDorSites:
            irradiacaoDorSites && irradiacaoDorSites.length > 0 ? irradiacaoDorSites.join(',') : null,
          estadoConscienciaSinais: estadoConscienciaSinaisKeysToCsv(estadoConscienciaSinais ?? []),
          tempoQueixa: tempoQueixa || null,
          fluxograma: fluxograma || null,
          discriminador: discriminador || null,
          especialidade: especialidade || null,
          classificadoEm: new Date(),
          sinaisVitais: {
            create: {
              paSistolica: sinaisVitais.paSistolica ?? null,
              paDiastolica: sinaisVitais.paDiastolica ?? null,
              frequenciaCardiaca: sinaisVitais.frequenciaCardiaca ?? null,
              frequenciaResp: sinaisVitais.frequenciaResp ?? null,
              spo2: sinaisVitais.spo2 ?? null,
              temperatura: sinaisVitais.temperatura ?? null,
              glicemia: sinaisVitais.glicemia ?? null,
              escalaDor: sinaisVitais.escalaDor ?? null,
              peso: sinaisVitais.peso ?? null,
              altura: sinaisVitais.altura ?? null,
              imc: imcCalculado ?? null,
            },
          },
        },
        include: { sinaisVitais: true },
      });

      // Avançar status do atendimento
      await tx.atendimento.update({
        where: { id: atendimentoId },
        data: { status: 'AGUARDANDO_ATENDIMENTO' },
      });

      // Registrar auditoria
      await tx.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'CRIACAO',
          entidade: 'Triagem',
          entidadeId: novaTriagem.id,
          valorNovo: String(corClassificacao),
          ipOrigem: req.headers.get('x-forwarded-for') ?? null,
        },
      });

      return novaTriagem;
    });

    const nomePacienteFila = nomeCompletoParaExibicao(
      atendimento.paciente.nomeExibicao,
      atendimento.paciente.nomeCriptografado
    );

    // Emitir evento WebSocket para atualizar fila em tempo real (noop se Pusher não configurado)
    dispararEventoPusher(CANAIS_PUSHER.filaTriagem, EVENTOS_PUSHER.FILA_ATUALIZADA, {
      atendimentoId,
      corClassificacao,
      nomePaciente: nomePacienteFila,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiResponse<{ triagemId: string; cor: string }>>(
      {
        sucesso: true,
        dados: {
          triagemId: triagem.id,
          cor: corClassificacao,
        },
      },
      { status: 201 }
    );
  } catch (erro: any) {
    console.error('[POST /api/triagem] ERRO CRÍTICO:', erro);
    return NextResponse.json<ApiResponse<never>>(
      { 
        sucesso: false, 
        erro: 'Erro interno ao registrar triagem.',
        detalhes: process.env.NODE_ENV === 'development' ? erro.message : undefined 
      },
      { status: 500 }
    );
  }
}

// PUT /api/triagem — Atualizar triagem existente (por atendimentoId)
export async function PUT(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) {
    return NextResponse.json<ApiResponse<never>>(
      { sucesso: false, erro: 'Não autorizado.' },
      { status: 401 }
    );
  }

  if (!['ADMIN', 'ENFERMEIRO'].includes(sessao.usuario.role)) {
    return NextResponse.json<ApiResponse<never>>(
      { sucesso: false, erro: 'Sem permissão para realizar triagem.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validacao = schemaRegistrarTriagem.safeParse(body);

    if (!validacao.success) {
      return NextResponse.json<ApiResponse<never>>(
        {
          sucesso: false,
          erro: 'Dados inválidos.',
          detalhes: validacao.error.flatten().fieldErrors as Record<string, string[]>,
        },
        { status: 400 }
      );
    }

    const {
      atendimentoId, corClassificacao, queixaPrincipal, categoriaQueixa, sinaisVitais,
      doencasPreexistentes, medicacoes, alergias, acidenteTrabalho, regraDor,
      tipoDorToracica, irradiacao, tempoQueixa, fluxograma, discriminador, especialidade,
      duracaoDor, localizacaoDor, irradiacaoDorSites, estadoConscienciaSinais,
    } = validacao.data;

    const atendimento = await prisma.atendimento.findFirst({
      where: { id: atendimentoId, deletedAt: null },
      include: { triagem: { select: { id: true, classificadoEm: true } } },
    });

    if (!atendimento) {
      return NextResponse.json<ApiResponse<never>>(
        { sucesso: false, erro: 'Atendimento não encontrado.' },
        { status: 404 }
      );
    }

    if (!atendimento.triagem) {
      return NextResponse.json<ApiResponse<never>>(
        { sucesso: false, erro: 'Triagem ainda não existe para este atendimento.' },
        { status: 404 }
      );
    }

    let imcCalculado: number | undefined;
    if (sinaisVitais.peso && sinaisVitais.altura) {
      imcCalculado = calcularImc(sinaisVitais.peso, sinaisVitais.altura).imc;
    }

    const triagemAtualizada = await prisma.$transaction(async (tx) => {
      const t = await tx.triagem.update({
        where: { atendimentoId },
        data: {
          corClassificacao,
          queixaPrincipal,
          categoriaQueixa: categoriaQueixa || null,
          doencasPreexistentes: doencasPreexistentes || null,
          medicacoes: medicacoes || null,
          alergias: alergias || null,
          acidenteTrabalho: acidenteTrabalho || false,
          regraDor: regraDor || null,
          nivelConsciencia: null,
          ritmo: null,
          tipoDorToracica: tipoDorToracica || null,
          irradiacao: irradiacao || null,
          duracaoDor: duracaoDor?.trim() || null,
          localizacaoDor: localizacaoDor?.trim() || null,
          irradiacaoDorSites:
            irradiacaoDorSites && irradiacaoDorSites.length > 0 ? irradiacaoDorSites.join(',') : null,
          estadoConscienciaSinais: estadoConscienciaSinaisKeysToCsv(estadoConscienciaSinais ?? []),
          tempoQueixa: tempoQueixa || null,
          fluxograma: fluxograma || null,
          discriminador: discriminador || null,
          especialidade: especialidade || null,
          classificadoEm: atendimento.triagem?.classificadoEm ?? new Date(),
          sinaisVitais: {
            upsert: {
              create: {
                paSistolica: sinaisVitais.paSistolica ?? null,
                paDiastolica: sinaisVitais.paDiastolica ?? null,
                frequenciaCardiaca: sinaisVitais.frequenciaCardiaca ?? null,
                frequenciaResp: sinaisVitais.frequenciaResp ?? null,
                spo2: sinaisVitais.spo2 ?? null,
                temperatura: sinaisVitais.temperatura ?? null,
                glicemia: sinaisVitais.glicemia ?? null,
                escalaDor: sinaisVitais.escalaDor ?? null,
                peso: sinaisVitais.peso ?? null,
                altura: sinaisVitais.altura ?? null,
                imc: imcCalculado ?? null,
              },
              update: {
                paSistolica: sinaisVitais.paSistolica ?? null,
                paDiastolica: sinaisVitais.paDiastolica ?? null,
                frequenciaCardiaca: sinaisVitais.frequenciaCardiaca ?? null,
                frequenciaResp: sinaisVitais.frequenciaResp ?? null,
                spo2: sinaisVitais.spo2 ?? null,
                temperatura: sinaisVitais.temperatura ?? null,
                glicemia: sinaisVitais.glicemia ?? null,
                escalaDor: sinaisVitais.escalaDor ?? null,
                peso: sinaisVitais.peso ?? null,
                altura: sinaisVitais.altura ?? null,
                imc: imcCalculado ?? null,
              },
            },
          },
        },
        include: { sinaisVitais: true },
      });

      await tx.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'ATUALIZACAO',
          entidade: 'Triagem',
          entidadeId: t.id,
          valorNovo: String(corClassificacao),
          ipOrigem: req.headers.get('x-forwarded-for') ?? null,
        },
      });

      return t;
    });

    dispararEventoPusher(CANAIS_PUSHER.filaTriagem, EVENTOS_PUSHER.FILA_ATUALIZADA, {
      atendimentoId,
      corClassificacao,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiResponse<{ triagemId: string; cor: string }>>(
      { sucesso: true, dados: { triagemId: triagemAtualizada.id, cor: corClassificacao } },
      { status: 200 }
    );
  } catch (erro: any) {
    console.error('[PUT /api/triagem] ERRO CRÍTICO:', erro);
    return NextResponse.json<ApiResponse<never>>(
      {
        sucesso: false,
        erro: 'Erro interno ao atualizar triagem.',
        detalhes: process.env.NODE_ENV === 'development' ? erro.message : undefined,
      },
      { status: 500 }
    );
  }
}
