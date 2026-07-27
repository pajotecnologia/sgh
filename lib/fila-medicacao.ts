import type { Prisma, StatusAtendimento } from '@prisma/client'

/** Atendimentos no PS/ambulatorial com prescrição pendente de aplicação */
export const STATUS_MEDICACAO_ATIVOS: StatusAtendimento[] = [
  'AGUARDANDO_ATENDIMENTO',
  'EM_ATENDIMENTO',
  'CONCLUIDO',
]

/** Base para atendimentos no módulo Medicação (exclui internados) */
export const whereAtendimentoMedicacaoBase: Prisma.AtendimentoWhereInput = {
  deletedAt: null,
  status: { in: STATUS_MEDICACAO_ATIVOS },
  paciente: { deletedAt: null },
  prontuario: { is: {} },
}

export const whereMedicacaoPendente: Prisma.AtendimentoWhereInput = {
  deletedAt: null,
  status: { in: STATUS_MEDICACAO_ATIVOS },
  paciente: { deletedAt: null },
  prontuario: {
    is: {
      prescricoes: {
        some: {
          tipo: 'PS',
          itens: {
            some: { status: 'PENDENTE' },
          },
        },
      },
    },
  },
}

export const includeAtendimentoMedicacao = {
  paciente: {
    select: {
      nomeExibicao: true,
      nomeCriptografado: true,
      cns: true,
    },
  },
  triagem: { select: { corClassificacao: true } },
  medico: { select: { nome: true } },
  prontuario: {
    select: {
      prescricoes: {
        where: { tipo: 'PS' },
        orderBy: { emitidaEm: 'desc' as const },
        select: {
          id: true,
          tipo: true,
          numeroPrescricao: true,
          emitidaEm: true,
          itens: {
            where: { status: 'PENDENTE' as const },
            orderBy: { createdAt: 'asc' as const },
            select: {
              id: true,
              nomeMedicamento: true,
              dose: true,
              via: true,
              frequencia: true,
              observacoes: true,
            },
          },
        },
      },
    },
  },
} as const

export const LABEL_STATUS_ATENDIMENTO: Partial<Record<StatusAtendimento, string>> = {
  AGUARDANDO_ATENDIMENTO: 'Aguard. atendimento',
  EM_ATENDIMENTO: 'Em atendimento',
  CONCLUIDO: 'Atend. concluído',
  AGUARDANDO_INTERNACAO: 'Aguard. internação',
  INTERNADO: 'Internado',
}

export function contarItensPendentes(
  prescricoes: { tipo?: string; itens: { id: string }[] }[] | null | undefined
): number {
  return (prescricoes ?? [])
    .filter((p) => (p.tipo ?? 'PS') === 'PS')
    .reduce((acc, p) => acc + (p.itens?.length ?? 0), 0)
}

export function listarItensPendentes(
  prescricoes: {
    tipo?: string
    itens: {
      id: string
      nomeMedicamento: string
      dose: string
      via: string
      frequencia: string
      observacoes: string | null
    }[]
  }[] | null | undefined
) {
  return (prescricoes ?? [])
    .filter((p) => (p.tipo ?? 'PS') === 'PS')
    .flatMap((p) => p.itens ?? [])
}

export const includeAplicacaoMedicacaoCompleta = {
  aplicadoPor: { select: { nome: true, role: true } },
  itemPrescricao: {
    select: {
      nomeMedicamento: true,
      dose: true,
      via: true,
      frequencia: true,
      status: true,
      observacoes: true,
      prescricao: {
        select: {
          numeroPrescricao: true,
          emitidaEm: true,
          observacoes: true,
          prontuario: {
            select: {
              atendimento: {
                select: {
                  id: true,
                  numeroAtendimento: true,
                  status: true,
                  createdAt: true,
                  paciente: {
                    select: { nomeExibicao: true, nomeCriptografado: true, cns: true },
                  },
                  triagem: { select: { corClassificacao: true } },
                  medico: { select: { nome: true } },
                },
              },
            },
          },
        },
      },
    },
  },
} as const

export type ChecklistCincoCertos = {
  pacienteCerto?: boolean
  medicamentoCerto?: boolean
  doseCerta?: boolean
  viaCerta?: boolean
  horarioCerto?: boolean
}

export function resumoChecklistCinco(json: unknown): { ok: number; total: number; completo: boolean } {
  const c = (json ?? {}) as ChecklistCincoCertos
  const flags = [
    c.pacienteCerto,
    c.medicamentoCerto,
    c.doseCerta,
    c.viaCerta,
    c.horarioCerto,
  ]
  const ok = flags.filter(Boolean).length
  return { ok, total: 5, completo: ok === 5 }
}

export function periodoDesdeDias(dias: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  d.setHours(0, 0, 0, 0)
  return d
}

export function parseDiasHistoricoMedicacao(valor: string | undefined): number {
  const n = parseInt(valor ?? '7', 10)
  if (!Number.isFinite(n)) return 7
  return Math.min(90, Math.max(1, n))
}

/** Aplicações em atendimentos do módulo Medicação (PS, não internados) */
export function whereAplicacaoMedicacaoHistorico(dias: number): Prisma.AplicacaoMedicamentoWhereInput {
  return {
    aplicadoEm: { gte: periodoDesdeDias(dias) },
    itemPrescricao: {
      prescricao: {
        tipo: 'PS',
        prontuario: {
          atendimento: whereAtendimentoMedicacaoBase,
        },
      },
    },
  }
}

export const LABEL_VIA: Record<string, string> = {
  ORAL: 'VO',
  INTRAVENOSA: 'IV',
  INTRAMUSCULAR: 'IM',
  SUBCUTANEA: 'SC',
  TOPICA: 'Tópica',
  INALATORIA: 'Inalatória',
  SUBLINGUAL: 'Sublingual',
  RETAL: 'Retal',
  OFTALMICA: 'Oftálmica',
  OTOLOGICA: 'Otológica',
  NASAL: 'Nasal',
}
