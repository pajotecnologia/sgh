// app/api/farmacia/ajuste-estoque-massa/route.ts
// API para consulta e gravação transacional de ajuste de estoque em lote / inventário dinâmico

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auditarLgpd } from '@/lib/auditoria-lgpd'

const ROLES_LEITURA = ['ADMIN', 'FARMACEUTICO', 'MEDICO', 'DIRETOR_CLINICO'] as const
const ROLES_ESCRITA = ['ADMIN', 'FARMACEUTICO'] as const

const schemaLoteAjuste = z.object({
  id: z.string().optional().nullable(),
  lote: z.string().min(1).max(80),
  validade: z.string().optional().nullable(),
  quantidade: z.number().int().min(0),
})

const schemaItemAjuste = z.object({
  medicamentoId: z.string(),
  novoSaldoTotal: z.number().int().min(0).optional(),
  lotes: z.array(schemaLoteAjuste).optional(),
  motivoItem: z.string().max(300).optional().nullable(),
})

const schemaAjusteMassa = z.object({
  motivoGeral: z.string().min(2).max(200),
  observacoesGerais: z.string().max(1000).optional().nullable(),
  dataAjuste: z.string().optional().nullable(),
  itens: z.array(schemaItemAjuste).min(1, 'Informe ao menos um item para ajuste.'),
})

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (!ROLES_LEITURA.includes(sessao.usuario.role as (typeof ROLES_LEITURA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  try {
    const url = new URL(req.url)
    const q = (url.searchParams.get('q') ?? '').trim()
    const tipoItem = (url.searchParams.get('tipoItem') ?? '').trim()
    const statusEstoque = (url.searchParams.get('statusEstoque') ?? 'TODOS').trim()
    const localizacao = (url.searchParams.get('localizacao') ?? '').trim()
    const apenasAtivos = (url.searchParams.get('ativo') ?? 'true').trim() !== 'false'

    const whereFiltros: any = {
      ...(apenasAtivos ? { ativo: true } : {}),
    }

    if (tipoItem && tipoItem !== 'TODOS') {
      whereFiltros.tipoItem = { equals: tipoItem, mode: 'insensitive' }
    }

    if (localizacao) {
      whereFiltros.localizacaoFisica = { contains: localizacao, mode: 'insensitive' }
    }

    if (q) {
      whereFiltros.OR = [
        { nome: { contains: q, mode: 'insensitive' } },
        { principioAtivo: { contains: q, mode: 'insensitive' } },
        { codigoEan: { contains: q, mode: 'insensitive' } },
        { codigoAnvisa: { contains: q, mode: 'insensitive' } },
        { classeTerapeutica: { contains: q, mode: 'insensitive' } },
        { sinonimos: { some: { sinonimo: { contains: q, mode: 'insensitive' } } } },
      ]
    }

    // Busca medicamentos com lotes
    const medicamentos = await prisma.tbMedicamento.findMany({
      where: whereFiltros,
      include: {
        lotes: {
          orderBy: [{ validade: 'asc' }, { quantidade: 'desc' }],
        },
      },
      orderBy: [{ tipoItem: 'asc' }, { nome: 'asc' }],
      take: 1000,
    })

    const hoje = new Date()
    const em90Dias = new Date(hoje.getTime() + 90 * 24 * 60 * 60 * 1000)

    // Filtra por status de estoque se solicitado
    let filtrados = medicamentos
    if (statusEstoque === 'COM_ESTOQUE') {
      filtrados = medicamentos.filter((m) => m.saldoAtual > 0)
    } else if (statusEstoque === 'ZERADOS') {
      filtrados = medicamentos.filter((m) => m.saldoAtual === 0)
    } else if (statusEstoque === 'ESTOQUE_BAIXO') {
      filtrados = medicamentos.filter((m) => m.saldoAtual <= m.estoqueMinimo)
    } else if (statusEstoque === 'VENCIMENTO_PROXIMO') {
      filtrados = medicamentos.filter((m) =>
        m.lotes.some((l) => l.validade && new Date(l.validade) <= em90Dias && l.quantidade > 0)
      )
    }

    return NextResponse.json({
      sucesso: true,
      total: filtrados.length,
      dados: filtrados,
    })
  } catch (erro) {
    console.error('[GET /api/farmacia/ajuste-estoque-massa]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao listar medicamentos para ajuste.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (!ROLES_ESCRITA.includes(sessao.usuario.role as (typeof ROLES_ESCRITA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão para ajustar estoque.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const validacao = schemaAjusteMassa.safeParse(body)
    if (!validacao.success) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Dados de ajuste inválidos.',
          detalhes: validacao.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { motivoGeral, observacoesGerais, itens } = validacao.data

    const resultadoTransacao = await prisma.$transaction(async (tx) => {
      let totalItensAtualizados = 0
      let totalEntradas = 0
      let totalSaidas = 0
      const detalhesAjustes: Array<{
        medicamentoId: string
        nome: string
        saldoAnterior: number
        saldoPosterior: number
        diferenca: number
      }> = []

      for (const item of itens) {
        const medAtual = await tx.tbMedicamento.findUnique({
          where: { id: item.medicamentoId },
          include: { lotes: true },
        })

        if (!medAtual) continue

        let novoSaldoCalculado: number

        // Se o usuário gerenciou lotes específicos
        if (item.lotes && item.lotes.length > 0) {
          let somaLotes = 0

          for (const loteItem of item.lotes) {
            const loteCodigo = loteItem.lote.trim().toUpperCase()
            const dataValidade = loteItem.validade ? new Date(loteItem.validade) : null

            if (loteItem.id) {
              await tx.tbMedicamentoLote.update({
                where: { id: loteItem.id },
                data: {
                  quantidade: loteItem.quantidade,
                  validade: dataValidade,
                },
              })
            } else {
              // Upsert por medicamentoId_lote
              await tx.tbMedicamentoLote.upsert({
                where: {
                  medicamentoId_lote: {
                    medicamentoId: medAtual.id,
                    lote: loteCodigo,
                  },
                },
                update: {
                  quantidade: loteItem.quantidade,
                  validade: dataValidade,
                },
                create: {
                  medicamentoId: medAtual.id,
                  lote: loteCodigo,
                  validade: dataValidade,
                  quantidade: loteItem.quantidade,
                },
              })
            }

            somaLotes += loteItem.quantidade
          }

          novoSaldoCalculado = Math.max(0, somaLotes)
        } else if (typeof item.novoSaldoTotal === 'number') {
          novoSaldoCalculado = Math.max(0, item.novoSaldoTotal)
        } else {
          continue
        }

        const diferenca = novoSaldoCalculado - medAtual.saldoAtual
        if (diferenca === 0) continue

        // Atualiza saldo atual do medicamento
        await tx.tbMedicamento.update({
          where: { id: medAtual.id },
          data: { saldoAtual: novoSaldoCalculado },
        })

        // Registra movimentação no livro-razão
        const obsFormatada = `[${motivoGeral}] ${
          item.motivoItem ? `Motivo item: ${item.motivoItem}. ` : ''
        }${observacoesGerais ? `Obs geral: ${observacoesGerais}` : 'Ajuste de inventário / contagem física'}`.trim()

        await tx.tbFarmaciaMovimentacao.create({
          data: {
            medicamentoId: medAtual.id,
            tipo: 'AJUSTE',
            quantidade: diferenca,
            saldoAnterior: medAtual.saldoAtual,
            saldoPosterior: novoSaldoCalculado,
            referenciaTipo: 'AjusteEmMassa',
            referenciaId: null,
            usuarioId: sessao.usuario.id,
            observacoes: obsFormatada,
          },
        })

        if (diferenca > 0) totalEntradas += diferenca
        if (diferenca < 0) totalSaidas += Math.abs(diferenca)
        totalItensAtualizados++

        detalhesAjustes.push({
          medicamentoId: medAtual.id,
          nome: medAtual.nome,
          saldoAnterior: medAtual.saldoAtual,
          saldoPosterior: novoSaldoCalculado,
          diferenca,
        })
      }

      return {
        totalItensAtualizados,
        totalEntradas,
        totalSaidas,
        detalhesAjustes,
      }
    })

    await auditarLgpd({
      usuarioId: sessao.usuario.id,
      role: sessao.usuario.role as never,
      atendimentoId: null,
      acao: 'EDICAO',
      entidade: 'TbFarmaciaAjusteMassa',
      entidadeId: null,
      ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null,
      detalhes: {
        motivoGeral,
        totalItens: resultadoTransacao.totalItensAtualizados,
        totalEntradas: resultadoTransacao.totalEntradas,
        totalSaidas: resultadoTransacao.totalSaidas,
      },
    })

    return NextResponse.json({
      sucesso: true,
      mensagem: `${resultadoTransacao.totalItensAtualizados} item(ns) ajustado(s) com sucesso.`,
      dados: resultadoTransacao,
    })
  } catch (erro) {
    console.error('[POST /api/farmacia/ajuste-estoque-massa]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao gravar ajustes de estoque.' }, { status: 500 })
  }
}
