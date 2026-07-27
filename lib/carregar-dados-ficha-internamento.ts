// lib/carregar-dados-ficha-internamento.ts — Dados para cadastro/impressão da ficha SUS de internação

import { format } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { montarPrefillLaudoInternacao } from '@/lib/laudo-internacao'
import { obterNomeCompletoPaciente } from '@/lib/nome-paciente-exibicao'
import {
  dataInternacaoReferencia,
  descricaoLeitoInternacao,
} from '@/lib/prefill-internamento'
import type { LaudoInternacaoPrefill } from '@/lib/laudo-internacao'

const includeAtendimento = {
  paciente: {
    include: { endereco: true },
  },
  medico: { select: { nome: true, crm: true } },
  leito: { select: { ala: true, quarto: true, codigo: true, tipo: true } },
  triagem: {
    select: {
      queixaPrincipal: true,
      sinaisVitais: true,
    },
  },
  prontuario: {
    include: {
      anamnese: true,
      diagnosticos: { orderBy: { principal: 'desc' as const } },
      encaminhamentos: { orderBy: { createdAt: 'desc' as const } },
      requisicoes: {
        include: { itens: { select: { nomeExame: true, resultado: true } } },
      },
    },
  },
  laudoInternacao: true,
}

export type ContextoInternacaoFicha = {
  dataAdmissaoSugerida: string
  enfermariaLeitoSugerido: string
}

export type LaudoExtraFicha = {
  id?: string
  status?: string
  cnesSolicitante?: string | null
  cnesExecutante?: string | null
  codigoIbgeMunicipio?: string | null
  codigoProcedimento?: string | null
  documentoProfissionalTipo?: string | null
  documentoProfissionalNumero?: string | null
  causasExternas?: Record<string, unknown> | null
  autorizacao?: Record<string, unknown> | null
  contextoInternacao?: ContextoInternacaoFicha
  updatedAt?: Date
} | null

export type DadosFichaInternamento = {
  prefill: LaudoInternacaoPrefill
  laudoExtra: LaudoExtraFicha
  paciente: {
    nomeExibicao: string
    numeroAtendimento: string
  }
}

export async function carregarDadosFichaInternamento(
  atendimentoId: string,
  usuario: { nome: string; crm?: string | null }
): Promise<DadosFichaInternamento | null> {
  const atendimento = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, deletedAt: null },
    include: includeAtendimento,
  })

  if (
    !atendimento ||
    !['INTERNADO', 'AGUARDANDO_INTERNACAO'].includes(atendimento.status)
  ) {
    return null
  }

  const instituicao = await prisma.instituicao.findFirst({
    select: {
      nomeInstituicao: true,
      nomeMunicipio: true,
      cidade: true,
      estado: true,
      cnes: true,
      codigoIbgeMunicipio: true,
    },
  })

  const prefill = montarPrefillLaudoInternacao(
    atendimento,
    instituicao,
    atendimento.laudoInternacao,
    { nome: usuario.nome, crm: usuario.crm }
  )

  const laudo = atendimento.laudoInternacao
  const leitoDesc = descricaoLeitoInternacao(atendimento.leito)
  const contextoInternacao: ContextoInternacaoFicha = {
    dataAdmissaoSugerida: format(dataInternacaoReferencia(atendimento), 'yyyy-MM-dd'),
    enfermariaLeitoSugerido: leitoDesc,
  }

  const laudoExtra: LaudoExtraFicha = laudo
    ? {
        id: laudo.id,
        status: laudo.status,
        cnesSolicitante: laudo.cnesSolicitante,
        cnesExecutante: laudo.cnesExecutante,
        codigoIbgeMunicipio: laudo.codigoIbgeMunicipio,
        codigoProcedimento: laudo.codigoProcedimento,
        documentoProfissionalTipo: laudo.documentoProfissionalTipo,
        documentoProfissionalNumero: laudo.documentoProfissionalNumero,
        causasExternas: laudo.causasExternas as Record<string, unknown> | null,
        autorizacao: laudo.autorizacao as Record<string, unknown> | null,
        contextoInternacao,
        updatedAt: laudo.updatedAt,
      }
    : { contextoInternacao }

  return {
    prefill,
    laudoExtra,
    paciente: {
      nomeExibicao: obterNomeCompletoPaciente(
        atendimento.paciente.nomeExibicao,
        atendimento.paciente.nomeCriptografado
      ),
      numeroAtendimento: atendimento.numeroAtendimento,
    },
  }
}
