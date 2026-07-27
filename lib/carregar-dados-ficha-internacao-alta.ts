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
  fichaMultidisciplinar: { select: { enfermagem: true } },
  fichaInternacaoAlta: true,
}

export type DadosFichaInternacaoAlta = {
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
}

export async function carregarDadosFichaInternacaoAlta(
  atendimentoId: string,
  usuario: { nome: string }
): Promise<DadosFichaInternacaoAlta | null> {
  const atendimento = await prisma.atendimento.findFirst({
    where: {
      id: atendimentoId,
      deletedAt: null,
      status: { in: ['AGUARDANDO_INTERNACAO', 'INTERNADO'] },
    },
    include: includeAtendimento,
  })

  if (!atendimento) return null

  const instituicao = await prisma.instituicao.findFirst({
    select: { nomeInstituicao: true },
  })

  const prefill = montarPrefillFichaInternacaoAlta(
    atendimento,
    instituicao,
    atendimento.fichaInternacaoAlta,
    usuario
  )

  const ficha = atendimento.fichaInternacaoAlta

  return {
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
  }
}
