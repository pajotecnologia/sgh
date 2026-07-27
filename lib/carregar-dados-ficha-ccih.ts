// lib/carregar-dados-ficha-ccih.ts

import { prisma } from '@/lib/prisma'
import { montarPrefillFichaCcih } from '@/lib/ccih-internacao'
import type { FichaCcihPrefill } from '@/lib/ccih-internacao'
import { includeAtendimentoInternacao } from '@/lib/prefill-internamento'

export type DadosFichaCcih = {
  prefill: FichaCcihPrefill
  ficha: {
    id: string
    status: string
    fatoresRisco?: Record<string, unknown> | null
    dispositivos?: Record<string, unknown> | null
    updatedAt: Date
  } | null
  paciente: {
    nomeExibicao: string
    numeroAtendimento: string
  }
}

export async function carregarDadosFichaCcih(
  atendimentoId: string,
  usuario: { nome: string; crm?: string | null; role: string }
): Promise<DadosFichaCcih | null> {
  const atendimento = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, deletedAt: null },
    include: {
      ...includeAtendimentoInternacao,
      fichaCcih: true,
    },
  })

  if (!atendimento || atendimento.status !== 'INTERNADO') {
    return null
  }

  const instituicao = await prisma.instituicao.findFirst({
    select: { nomeInstituicao: true },
  })

  const prefill = montarPrefillFichaCcih(atendimento, atendimento.fichaCcih, usuario, instituicao)
  const ficha = atendimento.fichaCcih

  return {
    prefill,
    ficha: ficha
      ? {
          id: ficha.id,
          status: ficha.status,
          fatoresRisco: ficha.fatoresRisco as Record<string, unknown> | null,
          dispositivos: ficha.dispositivos as Record<string, unknown> | null,
          updatedAt: ficha.updatedAt,
        }
      : null,
    paciente: {
      nomeExibicao: atendimento.paciente.nomeExibicao,
      numeroAtendimento: atendimento.numeroAtendimento,
    },
  }
}
