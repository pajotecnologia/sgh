import type { TipoPrescricao } from '@prisma/client'

export type PrescricaoComItens = {
  id: string
  tipo?: TipoPrescricao | string
  numeroPrescricao?: number
  emitidaEm?: string | Date
  createdAt?: string | Date
  observacoes?: string | null
  itens?: unknown[]
}

export const isPrescricaoPs = (p: PrescricaoComItens) => (p.tipo ?? 'PS') === 'PS'

export const isPrescricaoReceitaAlta = (p: PrescricaoComItens) => p.tipo === 'RECEITA_ALTA'

export const filtrarPrescricoesPs = <T extends PrescricaoComItens>(lista: T[] | null | undefined) =>
  (lista ?? []).filter(isPrescricaoPs)

export const filtrarPrescricoesReceitaAlta = <T extends PrescricaoComItens>(
  lista: T[] | null | undefined
) => (lista ?? []).filter(isPrescricaoReceitaAlta)

export const ultimaReceitaAlta = <T extends PrescricaoComItens>(lista: T[] | null | undefined) =>
  filtrarPrescricoesReceitaAlta(lista)[0] ?? null
