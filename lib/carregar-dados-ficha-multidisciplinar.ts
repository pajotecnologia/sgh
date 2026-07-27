// lib/carregar-dados-ficha-multidisciplinar.ts

import { prisma } from '@/lib/prisma'
import { montarPrefillFichaMultidisciplinar } from '@/lib/multidisciplinar-internacao'
import type { FichaMultidisciplinarPrefill } from '@/lib/multidisciplinar-internacao'
import { includeAtendimentoInternacao } from '@/lib/prefill-internamento'

export type DadosFichaMultidisciplinar = {
  prefill: FichaMultidisciplinarPrefill
  ficha: { id: string; status: string; updatedAt: Date } | null
  paciente: {
    nomeExibicao: string
    numeroAtendimento: string
  }
}

export async function carregarDadosFichaMultidisciplinar(
  atendimentoId: string,
  usuario: { nome: string; crm?: string | null; role: string }
): Promise<DadosFichaMultidisciplinar | null> {
  const atendimento = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, deletedAt: null },
    include: {
      ...includeAtendimentoInternacao,
      fichaMultidisciplinar: true,
    },
  })

  if (!atendimento || atendimento.status !== 'INTERNADO') {
    return null
  }

  const prefill = montarPrefillFichaMultidisciplinar(
    atendimento,
    atendimento.fichaMultidisciplinar,
    usuario
  )

  const ficha = atendimento.fichaMultidisciplinar

  return {
    prefill,
    ficha: ficha ? { id: ficha.id, status: ficha.status, updatedAt: ficha.updatedAt } : null,
    paciente: {
      nomeExibicao: atendimento.paciente.nomeExibicao,
      numeroAtendimento: atendimento.numeroAtendimento,
    },
  }
}
