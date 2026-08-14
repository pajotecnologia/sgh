// lib/farmacia-entrada.ts — Lógica compartilhada de entrada de estoque (manual e XML)

import type { Prisma, TipoEntradaFarmacia, TipoMovimentacaoFarmacia } from '@prisma/client'
import { creditarEstoqueLote, type TxClient } from '@/lib/farmacia-estoque'

export type ItemEntradaInput = {
  medicamentoId: string
  quantidade: number
  custoUnitario?: number | null
  lote?: string | null
  validade?: string | null
}

export type DadosEntradaNfInput = {
  tipo?: TipoEntradaFarmacia
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
  const tipoEntrada: TipoEntradaFarmacia = dados.tipo ?? (dados.importadaXml ? 'ENTRADA_NF' : 'ENTRADA_NF')

  const entrada = await tx.tbFarmaciaEntradaNf.create({
    data: {
      tipo: tipoEntrada,
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

  const tipoMov: TipoMovimentacaoFarmacia =
    tipoEntrada === 'EMPRESTIMO_ENTRADA'
      ? 'EMPRESTIMO_ENTRADA'
      : tipoEntrada === 'DEVOLUCAO_PACIENTE'
      ? 'DEVOLUCAO_PACIENTE'
      : tipoEntrada === 'ENTRADA_SEM_NOTA'
      ? 'ENTRADA_SEM_NOTA'
      : tipoEntrada === 'OUTRAS_ENTRADAS'
      ? 'OUTRAS_ENTRADAS'
      : 'ENTRADA_NF'

  for (const it of dados.itens) {
    const loteStr = it.lote?.trim() || 'SEM-LOTE'
    const validade = it.validade ? new Date(it.validade) : null

    const { loteId } = await creditarEstoqueLote(tx, {
      medicamentoId: it.medicamentoId,
      quantidade: it.quantidade,
      lote: loteStr,
      validade,
      tipo: tipoMov,
      referenciaTipo: 'TbFarmaciaEntradaNf',
      referenciaId: entrada.id,
      usuarioId,
      observacoes: dados.importadaXml
        ? 'Entrada via importação XML NF-e'
        : `Entrada (${tipoEntrada.replace(/_/g, ' ')})`,
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
