// lib/acompanhamento-paciente.ts
// Lógica de cálculo de posição na fila e dados públicos de acompanhamento individual via celular

import { prisma } from '@/lib/prisma';
import { resolverSenhaETipo, ordenarFilaHospitalar, type TipoAtendimentoInfo } from '@/lib/senhas';
import type { CorTriagem, StatusAtendimento } from '@/types';

export interface DadosAcompanhamentoPaciente {
  encontrado: boolean;
  atendimentoId: string;
  numeroAtendimento: string;
  senha: string;
  tipoAtendimento: TipoAtendimentoInfo;
  nomeExibicao: string;
  nomeMascarado: string;
  status: StatusAtendimento;
  etapaAtual: 'REQUISICAO' | 'TRIAGEM' | 'CONSULTORIO' | 'OBSERVACAO' | 'FINALIZADO';
  statusFormatado: string;
  mensagemStatus: string;
  corTriagem: CorTriagem | null;
  classificacaoRiscoNome?: string;
  entradaRecepcao: string;
  tempoTotalEsperaMinutos: number;
  pessoasNaFrente: number;
  posicaoFila: number;
  totalNaFila: number;
  foiChamado: boolean;
  isInternado: boolean;
  internacao?: {
    setor: string;
    leito: string | null;
    dataInternacao: string | null;
    status: 'AGUARDANDO_LEITO' | 'EM_LEITO' | 'ALTA_HOSPITALAR';
  } | null;
  chamada?: {
    salaDestino: string;
    chamadoEm: string;
    setorPainel: string;
    etapa: 'TRIAGEM' | 'CONSULTÓRIO';
    segundosAtras: number;
  } | null;
  etapas: {
    id: string;
    titulo: string;
    subtitulo: string;
    status: 'concluido' | 'atual' | 'pendente';
    detalhe?: string;
  }[];
  instituicao: {
    nome: string;
    unidade: string;
    logomarcaUrl: string | null;
  };
  atualizadoEm: string;
}

function mascararNome(nomeCompleto: string): string {
  if (!nomeCompleto?.trim()) return 'Paciente';
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length === 1) return partes[0];
  const primeiro = partes[0];
  const resto = partes.slice(1).map((p) => (p.length > 2 ? `${p[0]}.` : p)).join(' ');
  return `${primeiro} ${resto}`.toUpperCase();
}

export async function buscarDadosAcompanhamentoPaciente(
  identificador: string
): Promise<DadosAcompanhamentoPaciente | null> {
  const termo = (identificador || '').trim();
  if (!termo) return null;

  try {
    const atendimento = await prisma.atendimento.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { numeroAtendimento: termo },
          { id: termo.length === 36 ? termo : undefined },
        ].filter(Boolean) as never,
      },
      include: {
        paciente: {
          select: {
            id: true,
            nomeExibicao: true,
            nomeCriptografado: true,
            dataNascimento: true,
          },
        },
        triagem: {
          select: {
            id: true,
            corClassificacao: true,
            entradaTriagem: true,
            classificadoEm: true,
            queixaPrincipal: true,
          },
        },
        leito: {
          select: {
            id: true,
            codigo: true,
            ala: true,
            quarto: true,
            tipo: true,
            clinicaRef: {
              select: { nome: true },
            },
          },
        },
        fichaInternacaoAlta: {
          select: {
            id: true,
            status: true,
            dadosFormulario: true,
            updatedAt: true,
          },
        },
        laudoInternacao: {
          select: {
            id: true,
            status: true,
            clinica: true,
            diagnosticoInicial: true,
            dataSolicitacao: true,
            createdAt: true,
          },
        },
        chamadas: {
          orderBy: { chamadoEm: 'desc' },
          take: 1,
        },
      },
    });

    if (!atendimento || !atendimento.paciente) {
      return null;
    }

    const configInst = await prisma.instituicao.findFirst({
      select: {
        nomeInstituicao: true,
        logomarcaUrl: true,
      },
    });

    const nomeInst = configInst?.nomeInstituicao || 'SGH - HOSPITAL GERAL';
    const logoInst = configInst?.logomarcaUrl ?? null;

    const nomeOriginal =
      atendimento.paciente.nomeExibicao ||
      atendimento.paciente.nomeCriptografado ||
      'Paciente';
    const nomeMascarado = mascararNome(nomeOriginal);

    const senhaInfo = resolverSenhaETipo({
      numeroAtendimento: atendimento.numeroAtendimento,
      dataNascimento: atendimento.paciente.dataNascimento,
      obstetrico: atendimento.obstetrico,
    });

    const corTriagem = (atendimento.triagem?.corClassificacao as CorTriagem) ?? null;
    const agora = Date.now();
    const entradaRecepcao = atendimento.createdAt.toISOString();
    const tempoTotalEsperaMinutos = Math.max(
      0,
      Math.floor((agora - new Date(atendimento.createdAt).getTime()) / 60000)
    );

    // Identificação do fluxo de internação
    const isInternado =
      atendimento.status === 'INTERNADO' ||
      atendimento.status === 'AGUARDANDO_INTERNACAO' ||
      Boolean(atendimento.fichaInternacaoAlta) ||
      Boolean(atendimento.laudoInternacao) ||
      Boolean(atendimento.leitoId) ||
      (atendimento.vaiInternar && atendimento.status !== 'AGUARDANDO_TRIAGEM' && atendimento.status !== 'EM_TRIAGEM');

    const dadosFormFicha = (atendimento.fichaInternacaoAlta?.dadosFormulario as Record<string, unknown>) || null;
    const setorFicha =
      (typeof dadosFormFicha?.setor === 'string' && dadosFormFicha.setor) ||
      (typeof dadosFormFicha?.unidade === 'string' && dadosFormFicha.unidade) ||
      null;
    const leitoFicha =
      (typeof dadosFormFicha?.leito === 'string' && dadosFormFicha.leito) ||
      (typeof dadosFormFicha?.quarto === 'string' && dadosFormFicha.quarto) ||
      null;

    const setorInternacao =
      atendimento.leito?.clinicaRef?.nome ||
      atendimento.leito?.ala ||
      atendimento.laudoInternacao?.clinica ||
      setorFicha ||
      atendimento.setor ||
      'Clínica Médica / Internação';

    const leitoInternacao =
      (atendimento.leito
        ? `${atendimento.leito.codigo}${atendimento.leito.ala ? ` - ${atendimento.leito.ala}` : ''}`
        : null) ||
      leitoFicha ||
      atendimento.sala ||
      (atendimento.leitoId ? `Leito ${atendimento.leitoId}` : null);

    const internacaoInfo = isInternado
      ? {
          setor: setorInternacao,
          leito: leitoInternacao,
          dataInternacao:
            atendimento.laudoInternacao?.dataSolicitacao?.toISOString() ||
            atendimento.fichaInternacaoAlta?.updatedAt?.toISOString() ||
            atendimento.updatedAt.toISOString(),
          status: (atendimento.status === 'AGUARDANDO_INTERNACAO'
            ? 'AGUARDANDO_LEITO'
            : 'EM_LEITO') as 'AGUARDANDO_LEITO' | 'EM_LEITO' | 'ALTA_HOSPITALAR',
        }
      : null;

    // Calcular posição na fila (somente se ainda estiver aguardando na porta do PS)
    let pessoasNaFrente = 0;
    let posicaoFila = 1;
    let totalNaFila = 1;

    if (atendimento.status === 'AGUARDANDO_TRIAGEM') {
      const filaTriagem = await prisma.atendimento.findMany({
        where: {
          deletedAt: null,
          status: 'AGUARDANDO_TRIAGEM',
          paciente: { deletedAt: null },
        },
        include: {
          paciente: { select: { dataNascimento: true } },
          triagem: { select: { entradaTriagem: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      const filaMapeada = filaTriagem.map((a) => {
        const s = resolverSenhaETipo({
          numeroAtendimento: a.numeroAtendimento,
          dataNascimento: a.paciente?.dataNascimento,
          obstetrico: a.obstetrico,
        });
        return {
          id: a.id,
          tipoCodigo: s.tipo.codigo,
          dataNascimento: a.paciente?.dataNascimento,
          createdAt: a.createdAt,
          entradaFila: a.triagem?.entradaTriagem ?? a.createdAt,
        };
      });

      const filaOrdenada = ordenarFilaHospitalar(filaMapeada);
      totalNaFila = filaOrdenada.length;
      const idx = filaOrdenada.findIndex((item) => item.id === atendimento.id);
      if (idx !== -1) {
        posicaoFila = idx + 1;
        pessoasNaFrente = idx;
      }
    } else if (atendimento.status === 'AGUARDANDO_ATENDIMENTO' && !isInternado) {
      const filaMedica = await prisma.atendimento.findMany({
        where: {
          deletedAt: null,
          status: 'AGUARDANDO_ATENDIMENTO',
          paciente: { deletedAt: null },
        },
        include: {
          paciente: { select: { dataNascimento: true } },
          triagem: { select: { corClassificacao: true, entradaTriagem: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      const filaMapeada = filaMedica.map((a) => {
        const s = resolverSenhaETipo({
          numeroAtendimento: a.numeroAtendimento,
          dataNascimento: a.paciente?.dataNascimento,
          obstetrico: a.obstetrico,
        });
        return {
          id: a.id,
          tipoCodigo: s.tipo.codigo,
          corTriagem: a.triagem?.corClassificacao ?? null,
          dataNascimento: a.paciente?.dataNascimento,
          createdAt: a.createdAt,
          entradaFila: a.triagem?.entradaTriagem ?? a.createdAt,
        };
      });

      const filaOrdenada = ordenarFilaHospitalar(filaMapeada);
      totalNaFila = filaOrdenada.length;
      const idx = filaOrdenada.findIndex((item) => item.id === atendimento.id);
      if (idx !== -1) {
        posicaoFila = idx + 1;
        pessoasNaFrente = idx;
      }
    }

    // Verificar chamada recente no painel
    const ultimaChamada = atendimento.chamadas[0] ?? null;
    let chamadaInfo: DadosAcompanhamentoPaciente['chamada'] = null;
    let foiChamado = false;

    if (ultimaChamada) {
      const diffSegundos = Math.floor((agora - new Date(ultimaChamada.chamadoEm).getTime()) / 1000);
      // Considera ativo para alerta se foi chamado nos últimos 20 minutos
      if (diffSegundos <= 1200) {
        foiChamado = true;
        chamadaInfo = {
          salaDestino: ultimaChamada.salaDestino,
          chamadoEm: ultimaChamada.chamadoEm.toISOString(),
          setorPainel: ultimaChamada.setorPainel,
          etapa: corTriagem ? 'CONSULTÓRIO' : 'TRIAGEM',
          segundosAtras: diffSegundos,
        };
      }
    }

    // Determinar etapa e mensagens amigáveis
    let etapaAtual: DadosAcompanhamentoPaciente['etapaAtual'] = 'TRIAGEM';
    let statusFormatado = 'Aguardando Triagem';
    let mensagemStatus = 'Aguarde sua senha ser chamada para a Sala de Triagem e Classificação de Risco.';

    if (isInternado) {
      etapaAtual = 'OBSERVACAO';
      if (atendimento.status === 'AGUARDANDO_INTERNACAO') {
        statusFormatado = 'Aguardando Leito de Internação';
        mensagemStatus =
          'Encaminhamento para internação hospitalar emitido pela equipe médica. Aguardando alocação e preparação do leito pela enfermagem.';
      } else {
        statusFormatado = 'Paciente Internado';
        mensagemStatus = `Paciente admitido na unidade de internação hospitalar.${
          leitoInternacao ? ` Leito: ${leitoInternacao}` : ''
        }${setorInternacao ? ` • Setor: ${setorInternacao}` : ''}`;
      }
    } else if (atendimento.status === 'AGUARDANDO_TRIAGEM') {
      etapaAtual = 'TRIAGEM';
      if (foiChamado && chamadaInfo) {
        statusFormatado = `Chamado para Triagem — ${chamadaInfo.salaDestino}`;
        mensagemStatus = `🔔 Sua senha foi chamada! Dirija-se imediatamente à ${chamadaInfo.salaDestino}.`;
      } else if (pessoasNaFrente === 0) {
        statusFormatado = 'Você é o próximo da fila';
        mensagemStatus = 'Fique atento ao painel, sua senha será chamada a qualquer momento para a Triagem.';
      } else {
        statusFormatado = `Faltam ${pessoasNaFrente} ${pessoasNaFrente === 1 ? 'pessoa' : 'pessoas'} para sua vez`;
        mensagemStatus = 'Aguarde na sala de espera. Sua senha aparecerá no painel de TV e aqui no celular.';
      }
    } else if (atendimento.status === 'EM_TRIAGEM') {
      etapaAtual = 'TRIAGEM';
      statusFormatado = 'Em Atendimento na Triagem';
      mensagemStatus = 'Você está sendo atendido pela equipe de enfermagem.';
    } else if (atendimento.status === 'AGUARDANDO_ATENDIMENTO') {
      etapaAtual = 'CONSULTORIO';
      if (foiChamado && chamadaInfo) {
        statusFormatado = `Chamado para Consulta — ${chamadaInfo.salaDestino}`;
        mensagemStatus = `🔔 Sua senha foi chamada! Dirija-se imediatamente ao ${chamadaInfo.salaDestino}.`;
      } else if (pessoasNaFrente === 0) {
        statusFormatado = 'Você é o próximo para a Consulta';
        mensagemStatus = 'Triagem concluída! Sua consulta médica será chamada em instantes.';
      } else {
        statusFormatado = `Faltam ${pessoasNaFrente} ${pessoasNaFrente === 1 ? 'pessoa' : 'pessoas'} para a consulta`;
        mensagemStatus = 'Triagem realizada. Aguarde a chamada do médico no consultório.';
      }
    } else if (atendimento.status === 'EM_ATENDIMENTO') {
      etapaAtual = 'CONSULTORIO';
      statusFormatado = 'Em Consulta Médica';
      mensagemStatus = 'Você está em atendimento no consultório médico.';
    } else if (
      atendimento.status === 'CONCLUIDO' ||
      atendimento.status === 'ALTA' ||
      atendimento.status === 'TRANSFERIDO' ||
      atendimento.status === 'OBITO'
    ) {
      etapaAtual = 'FINALIZADO';
      statusFormatado = 'Atendimento Concluído';
      mensagemStatus = 'Atendimento finalizado com sucesso.';
    }

    // Linha do tempo de etapas inteligente para internação vs pronto-atendimento
    const etapas: DadosAcompanhamentoPaciente['etapas'] = [
      {
        id: 'recepcao',
        titulo: 'Recepção e Entrada',
        subtitulo: 'Senha emitida na recepção',
        status: 'concluido',
        detalhe: new Date(atendimento.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: 'triagem',
        titulo: 'Classificação de Risco (Triagem)',
        subtitulo: corTriagem ? 'Classificação realizada' : 'Enfermagem / Manchester',
        status:
          corTriagem || isInternado
            ? 'concluido'
            : atendimento.status === 'EM_TRIAGEM' || atendimento.status === 'AGUARDANDO_TRIAGEM'
            ? 'atual'
            : 'pendente',
        detalhe: corTriagem ? `Classificado (${corTriagem})` : undefined,
      },
      {
        id: 'consulta',
        titulo: 'Atendimento Médico',
        subtitulo: isInternado ? 'Indicação clínica de internação' : 'Consulta clínica e diagnóstico',
        status:
          isInternado || atendimento.status === 'CONCLUIDO' || atendimento.status === 'ALTA'
            ? 'concluido'
            : atendimento.status === 'AGUARDANDO_ATENDIMENTO' || atendimento.status === 'EM_ATENDIMENTO'
            ? 'atual'
            : 'pendente',
        detalhe: chamadaInfo ? `Destino: ${chamadaInfo.salaDestino}` : undefined,
      },
      ...(isInternado
        ? [
            {
              id: 'internacao',
              titulo: 'Internação Hospitalar',
              subtitulo: `Setor: ${setorInternacao}${leitoInternacao ? ` • Leito: ${leitoInternacao}` : ''}`,
              status: (atendimento.status === 'AGUARDANDO_INTERNACAO'
                ? 'atual'
                : 'concluido') as 'atual' | 'concluido',
              detalhe:
                atendimento.status === 'AGUARDANDO_INTERNACAO'
                  ? 'Aguardando Leito'
                  : leitoInternacao
                  ? `Leito ${leitoInternacao}`
                  : 'Internado',
            },
          ]
        : [
            {
              id: 'conclusao',
              titulo: 'Desfecho e Alta',
              subtitulo: 'Receita médica, exames ou alta do PS',
              status: (atendimento.status === 'CONCLUIDO' || atendimento.status === 'ALTA'
                ? 'concluido'
                : 'pendente') as 'concluido' | 'pendente',
            },
          ]),
    ];

    return {
      encontrado: true,
      atendimentoId: atendimento.id,
      numeroAtendimento: atendimento.numeroAtendimento,
      senha: senhaInfo.senha,
      tipoAtendimento: senhaInfo.tipo,
      nomeExibicao: nomeOriginal,
      nomeMascarado,
      status: atendimento.status,
      etapaAtual,
      statusFormatado,
      mensagemStatus,
      corTriagem,
      entradaRecepcao,
      tempoTotalEsperaMinutos,
      pessoasNaFrente,
      posicaoFila,
      totalNaFila,
      foiChamado,
      isInternado,
      internacao: internacaoInfo,
      chamada: chamadaInfo,
      etapas,
      instituicao: {
        nome: nomeInst,
        unidade: 'Pronto Atendimento e Urgência',
        logomarcaUrl: logoInst,
      },
      atualizadoEm: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[buscarDadosAcompanhamentoPaciente] Erro:', err);
    return null;
  }
}
