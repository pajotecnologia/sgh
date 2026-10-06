import { prisma } from '@/lib/prisma'
import { montarPrefillFichaMultidisciplinar } from '@/lib/multidisciplinar-internacao'
import type { FichaMultidisciplinarPrefill } from '@/lib/multidisciplinar-internacao'
import { includeAtendimentoInternacao } from '@/lib/prefill-internamento'
import { obterNomeCompletoPaciente } from '@/lib/nome-paciente-exibicao'

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
    where: {
      deletedAt: null,
      OR: [
        { id: atendimentoId },
        { numeroAtendimento: atendimentoId },
      ],
    },
    include: {
      ...includeAtendimentoInternacao,
      fichaMultidisciplinar: true,
    },
  })

  if (!atendimento) {
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
      nomeExibicao: obterNomeCompletoPaciente(
        atendimento.paciente.nomeExibicao,
        atendimento.paciente.nomeCriptografado
      ),
      numeroAtendimento: atendimento.numeroAtendimento,
    },
  }
}
