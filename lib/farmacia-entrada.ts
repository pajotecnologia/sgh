// lib/farmacia-entrada.ts — Lógica compartilhada de entrada de estoque (manual e XML)

import type { Prisma } from '@prisma/client'
import { creditarEstoqueLote, type TxClient } from '@/lib/farmacia-estoque'

export type ItemEntradaInput = {
  medicamentoId: string
  quantidade: number
  custoUnitario?: number | null
  lote?: string | null
  validade?: string | null
}

export type DadosEntradaNfInput = {
  numeroNota: string
  serie?: string | null
  fornecedorNome?: string | null
  fornecedorCnpj?: string | null
  emitidaEm?: string | null
  recebidaEm?: string | null
  observacoes?: string | null
  importadaXml?: boolean
  chaveNfe?: string | null
  itens: ItemEntradaInput[]
}

export async function registrarEntradaNf(
  tx: TxClient,
  dados: DadosEntradaNfInput,
  usuarioId: string
) {
  const emitidaEm = dados.emitidaEm ? new Date(dados.emitidaEm) : null
  const recebidaEm = dados.recebidaEm ? new Date(dados.recebidaEm) : new Date()

  const entrada = await tx.tbFarmaciaEntradaNf.create({
    data: {
      numeroNota: dados.numeroNota.trim(),
      serie: dados.serie?.trim() || null,
      fornecedorNome: dados.fornecedorNome?.trim() || null,
      fornecedorCnpj: dados.fornecedorCnpj?.trim() || null,
      emitidaEm,
      recebidaEm,
      observacoes: dados.observacoes?.trim() || null,
      importadaXml: dados.importadaXml ?? false,
      chaveNfe: dados.chaveNfe?.trim() || null,
      criadoPorId: usuarioId,
    },
  })

  const itensCriados: Prisma.TbFarmaciaEntradaNfItemGetPayload<object>[] = []

  for (const it of dados.itens) {
    const loteStr = it.lote?.trim() || 'SEM-LOTE'
    const validade = it.validade ? new Date(it.validade) : null

    const { loteId } = await creditarEstoqueLote(tx, {
      medicamentoId: it.medicamentoId,
      quantidade: it.quantidade,
      lote: loteStr,
      validade,
      tipo: dados.importadaXml ? 'ENTRADA_NF' : 'ENTRADA_NF',
      referenciaTipo: 'TbFarmaciaEntradaNf',
      referenciaId: entrada.id,
      usuarioId,
      observacoes: dados.importadaXml ? 'Entrada via importação XML NF-e' : 'Entrada manual NF',
    })

    const item = await tx.tbFarmaciaEntradaNfItem.create({
      data: {
        entradaId: entrada.id,
        medicamentoId: it.medicamentoId,
        loteId,
        quantidade: it.quantidade,
        custoUnitario: it.custoUnitario == null ? null : it.custoUnitario,
        lote: loteStr === 'SEM-LOTE' ? null : loteStr,
        validade,
      },
    })
    itensCriados.push(item)
  }

  return { ...entrada, itens: itensCriados }
}
