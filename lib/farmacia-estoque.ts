// lib/farmacia-estoque.ts — Controle de estoque com FEFO (First Expired, First Out)

import type { Prisma, TipoMovimentacaoFarmacia } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type TxClient = Prisma.TransactionClient

export type AlocacaoLote = {
  loteId: string
  lote: string
  validade: Date | null
  quantidade: number
}

export type ResultadoDebitoFefo = {
  alocacoes: AlocacaoLote[]
  saldoAnterior: number
  saldoPosterior: number
}

/** Lista lotes disponíveis ordenados por validade (FEFO) */
export async function listarLotesFefo(tx: TxClient, medicamentoId: string) {
  return tx.tbMedicamentoLote.findMany({
    where: { medicamentoId, quantidade: { gt: 0 } },
    orderBy: [{ validade: 'asc' }, { createdAt: 'asc' }],
  })
}

/** Sincroniza lotes quando há saldo no catálogo sem lote correspondente (dados legados) */
async function sincronizarLotesLegado(tx: TxClient, medicamentoId: string) {
  const med = await tx.tbMedicamento.findUnique({
    where: { id: medicamentoId },
    select: { saldoAtual: true },
  })
  if (!med || med.saldoAtual <= 0) return

  const agg = await tx.tbMedicamentoLote.aggregate({
    where: { medicamentoId },
    _sum: { quantidade: true },
  })
  const totalLotes = agg._sum.quantidade ?? 0
  if (totalLotes >= med.saldoAtual) return

  const diff = med.saldoAtual - totalLotes
  const existente = await tx.tbMedicamentoLote.findUnique({
    where: { medicamentoId_lote: { medicamentoId, lote: 'LEGADO' } },
  })
  if (existente) {
    await tx.tbMedicamentoLote.update({
      where: { id: existente.id },
      data: { quantidade: { increment: diff } },
    })
  } else {
    await tx.tbMedicamentoLote.create({
      data: { medicamentoId, lote: 'LEGADO', quantidade: diff, validade: null },
    })
  }
}

/** Calcula alocação FEFO sem alterar o banco */
export async function calcularAlocacaoFefo(
  tx: TxClient,
  medicamentoId: string,
  quantidadeNecessaria: number
): Promise<AlocacaoLote[]> {
  if (quantidadeNecessaria < 1) return []

  await sincronizarLotesLegado(tx, medicamentoId)

  const lotes = await listarLotesFefo(tx, medicamentoId)
  const alocacoes: AlocacaoLote[] = []
  let restante = quantidadeNecessaria

  for (const l of lotes) {
    if (restante <= 0) break
    const qtd = Math.min(l.quantidade, restante)
    alocacoes.push({
      loteId: l.id,
      lote: l.lote,
      validade: l.validade,
      quantidade: qtd,
    })
    restante -= qtd
  }

  if (restante > 0) {
    throw new Error(`Saldo insuficiente nos lotes para o medicamento. Faltam ${restante} unidade(s).`)
  }

  return alocacoes
}

/** Verifica se há saldo suficiente (catálogo + lotes) */
export async function verificarSaldoDisponivel(
  tx: TxClient,
  medicamentoId: string,
  quantidade: number
): Promise<{ ok: boolean; saldoAtual: number; mensagem?: string }> {
  const med = await tx.tbMedicamento.findUnique({
    where: { id: medicamentoId },
    select: { saldoAtual: true, nome: true },
  })
  if (!med) return { ok: false, saldoAtual: 0, mensagem: 'Medicamento não encontrado.' }
  if (med.saldoAtual < quantidade) {
    return {
      ok: false,
      saldoAtual: med.saldoAtual,
      mensagem: `Saldo insuficiente para "${med.nome}": disponível ${med.saldoAtual}, solicitado ${quantidade}.`,
    }
  }

  try {
    await calcularAlocacaoFefo(tx, medicamentoId, quantidade)
    return { ok: true, saldoAtual: med.saldoAtual }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Saldo insuficiente nos lotes.'
    return { ok: false, saldoAtual: med.saldoAtual, mensagem: msg }
  }
}

/** Credita estoque em lote (entrada NF/manual) */
export async function creditarEstoqueLote(
  tx: TxClient,
  params: {
    medicamentoId: string
    quantidade: number
    lote: string
    validade: Date | null
    tipo: TipoMovimentacaoFarmacia
    referenciaTipo: string
    referenciaId: string
    usuarioId: string | null
    observacoes?: string | null
  }
): Promise<{ loteId: string; saldoAnterior: number; saldoPosterior: number }> {
  const loteNorm = params.lote.trim() || 'SEM-LOTE'

  const med = await tx.tbMedicamento.findUniqueOrThrow({
    where: { id: params.medicamentoId },
    select: { saldoAtual: true },
  })
  const saldoAnterior = med.saldoAtual

  const loteExistente = await tx.tbMedicamentoLote.findUnique({
    where: { medicamentoId_lote: { medicamentoId: params.medicamentoId, lote: loteNorm } },
  })

  let loteId: string
  if (loteExistente) {
    await tx.tbMedicamentoLote.update({
      where: { id: loteExistente.id },
      data: { quantidade: { increment: params.quantidade } },
    })
    loteId = loteExistente.id
  } else {
    const criado = await tx.tbMedicamentoLote.create({
      data: {
        medicamentoId: params.medicamentoId,
        lote: loteNorm,
        validade: params.validade,
        quantidade: params.quantidade,
      },
    })
    loteId = criado.id
  }

  const atualizado = await tx.tbMedicamento.update({
    where: { id: params.medicamentoId },
    data: { saldoAtual: { increment: params.quantidade } },
    select: { saldoAtual: true },
  })

  await tx.tbFarmaciaMovimentacao.create({
    data: {
      medicamentoId: params.medicamentoId,
      loteId,
      tipo: params.tipo,
      quantidade: params.quantidade,
      saldoAnterior,
      saldoPosterior: atualizado.saldoAtual,
      referenciaTipo: params.referenciaTipo,
      referenciaId: params.referenciaId,
      usuarioId: params.usuarioId,
      observacoes: params.observacoes ?? null,
    },
  })

  return { loteId, saldoAnterior, saldoPosterior: atualizado.saldoAtual }
}

/** Debita estoque usando FEFO */
export async function debitarEstoqueFefo(
  tx: TxClient,
  params: {
    medicamentoId: string
    quantidade: number
    tipo: TipoMovimentacaoFarmacia
    referenciaTipo: string
    referenciaId: string
    usuarioId: string | null
    observacoes?: string | null
  }
): Promise<ResultadoDebitoFefo> {
  const verificacao = await verificarSaldoDisponivel(tx, params.medicamentoId, params.quantidade)
  if (!verificacao.ok) {
    throw new Error(verificacao.mensagem ?? 'Saldo insuficiente.')
  }

  const alocacoes = await calcularAlocacaoFefo(tx, params.medicamentoId, params.quantidade)
  const saldoAnterior = verificacao.saldoAtual

  for (const a of alocacoes) {
    const upd = await tx.tbMedicamentoLote.updateMany({
      where: { id: a.loteId, quantidade: { gte: a.quantidade } },
      data: { quantidade: { decrement: a.quantidade } },
    })
    if (upd.count === 0) {
      throw new Error(`Conflito de estoque no lote ${a.lote}. Tente novamente.`)
    }
  }

  const atualizado = await tx.tbMedicamento.update({
    where: { id: params.medicamentoId, saldoAtual: { gte: params.quantidade } },
    data: { saldoAtual: { decrement: params.quantidade } },
    select: { saldoAtual: true },
  })

  if (!atualizado) {
    throw new Error('Saldo insuficiente no catálogo.')
  }

  for (const a of alocacoes) {
    await tx.tbFarmaciaMovimentacao.create({
      data: {
        medicamentoId: params.medicamentoId,
        loteId: a.loteId,
        tipo: params.tipo,
        quantidade: -a.quantidade,
        saldoAnterior,
        saldoPosterior: atualizado.saldoAtual,
        referenciaTipo: params.referenciaTipo,
        referenciaId: params.referenciaId,
        usuarioId: params.usuarioId,
        observacoes: params.observacoes ?? null,
      },
    })
  }

  return { alocacoes, saldoAnterior, saldoPosterior: atualizado.saldoAtual }
}

/** Medicamentos abaixo do estoque mínimo */
export async function listarAbaixoEstoqueMinimo() {
  const meds = await prisma.tbMedicamento.findMany({
    where: { ativo: true, estoqueMinimo: { gt: 0 } },
    orderBy: [{ saldoAtual: 'asc' }],
  })
  return meds.filter((m) => m.saldoAtual <= m.estoqueMinimo)
}

/** Itens faltantes: prescrições aguardando triagem sem saldo */
export async function listarFaltantesDispensacao() {
  const pendentes = await prisma.tbFarmaciaDispensacao.findMany({
    where: { status: 'AGUARDANDO_TRIAGEM' },
    include: {
      item: {
        include: {
          medicamento: { select: { id: true, nome: true, saldoAtual: true, estoqueMinimo: true } },
          prescricao: {
            include: {
              atendimento: {
                select: {
                  numeroAtendimento: true,
                  setor: true,
                  sala: true,
                  paciente: { select: { nomeExibicao: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ createdAt: 'asc' }],
  })

  return pendentes
    .filter((d) => {
      const med = d.item.medicamento
      if (!med) return true
      return med.saldoAtual < (d.item.quantidadeSolicitada ?? 1)
    })
    .map((d) => ({
      dispensacaoId: d.id,
      itemId: d.item.id,
      medicamentoNome: d.item.medicamentoNome,
      quantidadeSolicitada: d.item.quantidadeSolicitada,
      saldoAtual: d.item.medicamento?.saldoAtual ?? null,
      deficit:
        d.item.medicamento != null
          ? Math.max(0, (d.item.quantidadeSolicitada ?? 1) - d.item.medicamento.saldoAtual)
          : null,
      atendimento: d.item.prescricao.atendimento,
    }))
}
