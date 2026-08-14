// app/api/farmacia/medicamentos/[id]/lotes/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auditarLgpd } from '@/lib/auditoria-lgpd'

const ROLES_ESCRITA = ['ADMIN', 'FARMACEUTICO'] as const

const schemaCriarLote = z.object({
  lote: z.string().min(1).max(80),
  validade: z.string().optional().nullable(),
  quantidade: z.number().int().min(0),
  observacoes: z.string().max(500).optional().nullable(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (!ROLES_ESCRITA.includes(sessao.usuario.role as (typeof ROLES_ESCRITA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  try {
    const { id: medicamentoId } = await params
    const body = await req.json()
    const validacao = schemaCriarLote.safeParse(body)
    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const d = validacao.data

    const med = await prisma.tbMedicamento.findUnique({ where: { id: medicamentoId } })
    if (!med) {
      return NextResponse.json({ sucesso: false, erro: 'Medicamento não encontrado.' }, { status: 404 })
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const loteCodigo = d.lote.trim().toUpperCase()
      const dataValidade = d.validade ? new Date(d.validade) : null

      const loteExistente = await tx.tbMedicamentoLote.findUnique({
        where: {
          medicamentoId_lote: {
            medicamentoId,
            lote: loteCodigo,
          },
        },
      })

      let loteObj
      let diferencaQtde = 0

      if (loteExistente) {
        diferencaQtde = d.quantidade - loteExistente.quantidade
        loteObj = await tx.tbMedicamentoLote.update({
          where: { id: loteExistente.id },
          data: {
            validade: dataValidade ?? loteExistente.validade,
            quantidade: d.quantidade,
          },
        })
      } else {
        diferencaQtde = d.quantidade
        loteObj = await tx.tbMedicamentoLote.create({
          data: {
            medicamentoId,
            lote: loteCodigo,
            validade: dataValidade,
            quantidade: d.quantidade,
          },
        })
      }

      // Recalcula saldo total do medicamento
      const agregacao = await tx.tbMedicamentoLote.aggregate({
        where: { medicamentoId },
        _sum: { quantidade: true },
      })
      const novoSaldoTotal = agregacao._sum.quantidade ?? 0

      const medAtualizado = await tx.tbMedicamento.update({
        where: { id: medicamentoId },
        data: { saldoAtual: Math.max(0, novoSaldoTotal) },
      })

      // Registra livro-razão de estoque
      if (diferencaQtde !== 0) {
        await tx.tbFarmaciaMovimentacao.create({
          data: {
            medicamentoId,
            loteId: loteObj.id,
            tipo: diferencaQtde > 0 ? 'ENTRADA_MANUAL' : 'AJUSTE',
            quantidade: diferencaQtde,
            saldoAnterior: med.saldoAtual,
            saldoPosterior: medAtualizado.saldoAtual,
            referenciaTipo: 'TbMedicamentoLote',
            referenciaId: loteObj.id,
            usuarioId: sessao.usuario.id,
            observacoes: d.observacoes ?? 'Ajuste manual de lote / validade.',
          },
        })
      }

      return { lote: loteObj, medicamento: medAtualizado }
    })

    await auditarLgpd({
      usuarioId: sessao.usuario.id,
      role: sessao.usuario.role as never,
      atendimentoId: null,
      acao: 'EDICAO',
      entidade: 'TbMedicamentoLote',
      entidadeId: resultado.lote.id,
      ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null,
      detalhes: { lote: d.lote, quantidade: d.quantidade, validade: d.validade },
    })

    return NextResponse.json({ sucesso: true, dados: resultado })
  } catch (e) {
    console.error('[POST /api/farmacia/medicamentos/[id]/lotes]', e)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 })
  }
}
