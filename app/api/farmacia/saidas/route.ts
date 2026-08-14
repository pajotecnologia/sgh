// app/api/farmacia/saidas/route.ts

// Saída de estoque (baixa manual com FEFO)



import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { z } from 'zod'

import { authOptions } from '@/lib/auth'

import { prisma } from '@/lib/prisma'

import { auditarLgpd } from '@/lib/auditoria-lgpd'

import { debitarEstoqueFefo, verificarSaldoDisponivel } from '@/lib/farmacia-estoque'



const ROLES = ['ADMIN', 'FARMACEUTICO'] as const



const schemaItem = z.object({

  medicamentoId: z.string().uuid(),

  quantidade: z.number().int().min(1),

  motivo: z.string().max(500).optional().nullable(),

})



const schemaCriar = z.object({

  tipo: z.enum([

    'DISPENSACAO_PRESCRICAO',

    'SAIDA_SEM_NOTA',

    'EMPRESTIMO_SAIDA',

    'PERDA_AVARIA_VALIDADE',

    'DEVOLUCAO_FORNECEDOR',

    'OUTRAS_SAIDAS',

    'BAIXA_MANUAL',

  ]),

  atendimentoId: z.string().uuid().optional().nullable(),

  observacoes: z.string().max(2000).optional().nullable(),

  itens: z.array(schemaItem).min(1).max(200),

})



export async function GET(req: NextRequest) {

  const sessao = await getServerSession(authOptions)

  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })

  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) {

    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })

  }



  try {

    const url = new URL(req.url)

    const q = (url.searchParams.get('q') ?? '').trim()

    const tipo = (url.searchParams.get('tipo') ?? '').trim()



    const saidas = await prisma.tbFarmaciaSaida.findMany({

      where: {

        AND: [

          tipo ? { tipo: tipo as any } : {},

          q

            ? {

                OR: [

                  { observacoes: { contains: q, mode: 'insensitive' } },

                  { atendimento: { numeroAtendimento: { contains: q, mode: 'insensitive' } } },

                ],

              }

            : {},

        ],

      },

      include: {

        itens: {

          include: {

            medicamento: { select: { nome: true, principioAtivo: true } },

            loteRef: { select: { lote: true, validade: true } },

          },

        },

        criadoPor: { select: { nome: true } },

        atendimento: { select: { id: true, numeroAtendimento: true, setor: true, sala: true } },

      },

      orderBy: [{ createdAt: 'desc' }],

      take: 200,

    })



    await auditarLgpd({

      usuarioId: sessao.usuario.id,

      role: sessao.usuario.role as never,

      atendimentoId: null,

      acao: 'LEITURA',

      entidade: 'TbFarmaciaSaida',

      entidadeId: null,

      ipOrigem: req.headers.get('x-forwarded-for') ?? null,

      userAgent: req.headers.get('user-agent') ?? null,

      detalhes: { q: q || null, tipo: tipo || null, total: saidas.length },

    })



    return NextResponse.json({ sucesso: true, dados: saidas })

  } catch (e) {

    console.error('[GET /api/farmacia/saidas]', e)

    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 })

  }

}



export async function POST(req: NextRequest) {

  const sessao = await getServerSession(authOptions)

  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })

  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) {

    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })

  }



  try {

    const body = await req.json()

    const validacao = schemaCriar.safeParse(body)

    if (!validacao.success) {

      return NextResponse.json(

        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },

        { status: 400 }

      )

    }



    const d = validacao.data

    if (d.tipo === 'DISPENSACAO_PRESCRICAO') {

      return NextResponse.json(

        {

          sucesso: false,

          erro: 'Saída por dispensação é gerada pela triagem de prescrição do paciente.',

        },

        { status: 400 }

      )

    }



    for (const it of d.itens) {

      const check = await verificarSaldoDisponivel(prisma, it.medicamentoId, it.quantidade)

      if (!check.ok) {

        return NextResponse.json(

          { sucesso: false, erro: check.mensagem ?? 'Saldo insuficiente.' },

          { status: 409 }

        )

      }

    }



    const saida = await prisma.$transaction(async (tx) => {

      const header = await tx.tbFarmaciaSaida.create({

        data: {

          tipo: d.tipo as any,

          atendimentoId: d.atendimentoId ?? null,

          observacoes: d.observacoes?.trim() || null,

          criadoPorId: sessao.usuario.id,

        },

      })



      const itensSaida: Array<{

        saidaId: string

        medicamentoId: string

        loteId: string | null

        quantidade: number

        motivo: string | null

      }> = []



      const tipoMov =

        d.tipo === 'EMPRESTIMO_SAIDA'

          ? 'EMPRESTIMO_SAIDA'

          : d.tipo === 'PERDA_AVARIA_VALIDADE'

          ? 'PERDA_AVARIA_VALIDADE'

          : d.tipo === 'DEVOLUCAO_FORNECEDOR'

          ? 'DEVOLUCAO_FORNECEDOR'

          : d.tipo === 'SAIDA_SEM_NOTA'

          ? 'SAIDA_SEM_NOTA'

          : d.tipo === 'OUTRAS_SAIDAS'

          ? 'OUTRAS_SAIDAS'

          : 'SAIDA_MANUAL'



      for (const it of d.itens) {

        const debito = await debitarEstoqueFefo(tx, {

          medicamentoId: it.medicamentoId,

          quantidade: it.quantidade,

          tipo: tipoMov as any,

          referenciaTipo: 'TbFarmaciaSaida',

          referenciaId: header.id,

          usuarioId: sessao.usuario.id,

          observacoes: it.motivo ?? d.observacoes ?? null,

        })



        for (const a of debito.alocacoes) {

          itensSaida.push({

            saidaId: header.id,

            medicamentoId: it.medicamentoId,

            loteId: a.loteId,
            quantidade: a.quantidade,
            motivo: it.motivo?.trim() || null,
          })
        }
      }

      if (itensSaida.length > 0) {
        await tx.tbFarmaciaSaidaItem.createMany({ data: itensSaida })
      }

      const created = await tx.tbFarmaciaSaida.findUniqueOrThrow({
        where: { id: header.id },
        include: { itens: true },
      })



      await tx.tbAuditoriaLog.create({

        data: {

          usuarioId: sessao.usuario.id,

          role: sessao.usuario.role,

          atendimentoId: d.atendimentoId ?? null,

          acao: 'CRIACAO',

          entidade: 'TbFarmaciaSaida',

          entidadeId: created.id,

          ipOrigem: req.headers.get('x-forwarded-for') ?? null,

          userAgent: req.headers.get('user-agent') ?? null,

          detalhes: {

            tipo: d.tipo,

            totalItens: created.itens.length,

            totalQuantidade: created.itens.reduce((acc, x) => acc + x.quantidade, 0),

          },

        },

      })



      return created

    })



    return NextResponse.json({ sucesso: true, dados: saida })

  } catch (e: unknown) {

    console.error('[POST /api/farmacia/saidas]', e)

    const msg = e instanceof Error ? e.message : ''

    if (msg.toLowerCase().includes('saldo')) {

      return NextResponse.json({ sucesso: false, erro: msg }, { status: 409 })

    }

    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 })

  }

}
