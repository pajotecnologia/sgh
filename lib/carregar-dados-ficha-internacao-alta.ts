// lib/carregar-dados-ficha-internacao-alta.ts

import { prisma } from '@/lib/prisma'
import { montarPrefillFichaInternacaoAlta } from '@/lib/ficha-internacao-alta'
import type { FichaInternacaoAltaPrefill } from '@/lib/ficha-internacao-alta'
import { obterNomeCompletoPaciente } from '@/lib/nome-paciente-exibicao'

const includeAtendimento = {
  paciente: { include: { endereco: true } },
  medico: { select: { nome: true, crm: true } },
  origem: { select: { descricao: true, procedenciaFicha: true } },
  triagem: {
    select: {
      queixaPrincipal: true,
      sinaisVitais: {
        select: {
          paSistolica: true,
          paDiastolica: true,
          frequenciaCardiaca: true,
          temperatura: true,
          peso: true,
        },
      },
    },
  },
  prontuario: {
    include: {
      anamnese: true,
      diagnosticos: { orderBy: { principal: 'desc' as const } },
      encaminhamentos: { orderBy: { createdAt: 'desc' as const } },
      evolucoes: {
        orderBy: { registradoEm: 'desc' as const },
        take: 30,
        include: { autor: { select: { nome: true } } },
      },
    },
  },
  fichasEvolucaoTurno: {
    orderBy: [{ dataReferencia: 'desc' as const }, { registradoEm: 'desc' as const }],
    select: {
      turno: true,
      dataReferencia: true,
      registradoEm: true,
      estadoGeral: true,
      evolucaoClinica: true,
      dietaEliminacoes: true,
      medicamentosProcedimentos: true,
      intercorrencias: true,
      condutaProximoTurno: true,
      nomeProfissional: true,
    },
  },
  leito: { select: { codigo: true, ala: true, quarto: true, tipo: true } },
  fichaMultidisciplinar: { select: { enfermagem: true } },
  fichaInternacaoAlta: true,
}

export type DadosFichaInternacaoAlta = {
  atendimentoId: string
  prefill: FichaInternacaoAltaPrefill
  ficha: {
    id: string
    status: string
    updatedAt: Date
  } | null
  paciente: {
    nomeExibicao: string
    numeroAtendimento: string
    statusAtendimento: string
  }
  leito?: {
    codigo: string
    ala: string
    quarto: string | null
    tipo: string
  } | null
  instituicao?: {
    nomeInstituicao?: string | null
    nomeMunicipio?: string | null
    endereco?: string | null
    bairro?: string | null
    cidade?: string | null
    estado?: string | null
    cep?: string | null
    cnes?: string | null
    codigoIbgeMunicipio?: string | null
    logomarcaUrl?: string | null
  } | null
}

export async function carregarDadosFichaInternacaoAlta(
  atendimentoId: string,
  usuario: { nome: string }
): Promise<DadosFichaInternacaoAlta | null> {
  const atendimento = await prisma.atendimento.findFirst({
    where: {
      id: atendimentoId,
      deletedAt: null,
    },
    include: includeAtendimento,
  })

  if (!atendimento) return null

  const instituicao = await prisma.instituicao.findFirst({
    select: {
      nomeInstituicao: true,
      nomeMunicipio: true,
      endereco: true,
      bairro: true,
      cidade: true,
      estado: true,
      cep: true,
      cnes: true,
      codigoIbgeMunicipio: true,
      logomarcaUrl: true,
    },
  })

  const prefill = montarPrefillFichaInternacaoAlta(
    atendimento,
    instituicao,
    atendimento.fichaInternacaoAlta,
    usuario
  )

  const ficha = atendimento.fichaInternacaoAlta

  return {
    atendimentoId: atendimento.id,
    prefill,
    ficha: ficha
      ? { id: ficha.id, status: ficha.status, updatedAt: ficha.updatedAt }
      : null,
    paciente: {
      nomeExibicao: obterNomeCompletoPaciente(
        atendimento.paciente.nomeExibicao,
        atendimento.paciente.nomeCriptografado
      ),
      numeroAtendimento: atendimento.numeroAtendimento,
      statusAtendimento: atendimento.status,
    },
    leito: atendimento.leito,
    instituicao,
  }
}

