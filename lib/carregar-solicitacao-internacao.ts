// lib/carregar-solicitacao-internacao.ts — Dados da solicitação médica para recepção pela enfermagem

import { prisma } from '@/lib/prisma'
import { obterNomeCompletoPaciente } from '@/lib/nome-paciente-exibicao'

export type SolicitacaoInternacaoDados = {
  atendimentoId: string
  numeroAtendimento: string
  status: string
  obstetrico: boolean
  nomePaciente: string
  temEncaminhamentoFormal: boolean
  encaminhamento: {
    id: string
    tipoClinica: string
    cidInternacao: string
    prioridade: string
    resumoClinico: string
    justificativa: string
    solicitadoEm: string
  }
  medico: { nome: string; crm: string | null } | null
}

export async function carregarSolicitacaoInternacao(
  atendimentoId: string
): Promise<SolicitacaoInternacaoDados | null> {
  // Aceita tanto AGUARDANDO_INTERNACAO quanto INTERNADO (para edição posterior da ficha)
  const atendimento = await prisma.atendimento.findFirst({
    where: {
      id: atendimentoId,
      deletedAt: null,
      status: { in: ['AGUARDANDO_INTERNACAO', 'INTERNADO'] },
    },
    include: {
      // obstetrico já vem por padrão nos campos escalares
      paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
      medico: { select: { nome: true, crm: true } },
      prontuario: {
        select: {
          encaminhamentos: {
            where: { tipo: 'INTERNACAO' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  })

  if (!atendimento) return null

  const enc = atendimento.prontuario?.encaminhamentos?.[0]
  const nomePaciente = obterNomeCompletoPaciente(
    atendimento.paciente.nomeExibicao,
    atendimento.paciente.nomeCriptografado
  )

  // Se não existe encaminhamento formal, cria um encaminhamento sintético com dados mínimos
  // para que a página de admissão funcione sem quebrar
  if (!enc) {
    return {
      atendimentoId: atendimento.id,
      numeroAtendimento: atendimento.numeroAtendimento,
      status: atendimento.status,
      obstetrico: atendimento.obstetrico,
      nomePaciente,
      temEncaminhamentoFormal: false,
      encaminhamento: {
        id: '',
        tipoClinica: atendimento.setor ?? 'Clínica Geral',
        cidInternacao: '',
        prioridade: '',
        resumoClinico: '',
        justificativa: '',
        solicitadoEm: atendimento.updatedAt?.toISOString() ?? new Date().toISOString(),
      },
      medico: atendimento.medico,
    }
  }

  return {
    atendimentoId: atendimento.id,
    numeroAtendimento: atendimento.numeroAtendimento,
    status: atendimento.status,
    obstetrico: atendimento.obstetrico,
    nomePaciente,
    temEncaminhamentoFormal: true,
    encaminhamento: {
      id: enc.id,
      tipoClinica: enc.especialidade,
      cidInternacao: enc.cidInternacao ?? '',
      prioridade: enc.prioridade ?? '',
      resumoClinico: enc.resumoClinco ?? '',
      justificativa: enc.justificativa ?? '',
      solicitadoEm: enc.createdAt.toISOString(),
    },
    medico: atendimento.medico,
  }
}
