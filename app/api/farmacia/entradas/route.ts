// app/api/farmacia/entradas/route.ts

// Entrada de estoque via Nota Fiscal (NF)



import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { z } from 'zod'

import { authOptions } from '@/lib/auth'

import { prisma } from '@/lib/prisma'

import { auditarLgpd } from '@/lib/auditoria-lgpd'

import { registrarEntradaNf } from '@/lib/farmacia-entrada'



const ROLES = ['ADMIN', 'FARMACEUTICO'] as const



const schemaItem = z.object({

  medicamentoId: z.string().uuid(),

  quantidade: z.number().int().min(1),

  custoUnitario: z.number().min(0).optional().nullable(),

  lote: z.string().max(80).optional().nullable(),

  validade: z.string().optional().nullable(),

})



const schemaCriar = z.object({

  numeroNota: z.string().min(1).max(60),

  serie: z.string().max(20).optional().nullable(),

  fornecedorNome: z.string().max(180).optional().nullable(),

  fornecedorCnpj: z.string().max(20).optional().nullable(),

  emitidaEm: z.string().optional().nullable(),

  recebidaEm: z.string().optional().nullable(),

  observacoes: z.string().max(2000).optional().nullable(),

  importadaXml: z.boolean().optional(),

  chaveNfe: z.string().max(44).optional().nullable(),

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



    const entradas = await prisma.tbFarmaciaEntradaNf.findMany({

      where: q

        ? {

            OR: [

              { numeroNota: { contains: q, mode: 'insensitive' } },

              { fornecedorNome: { contains: q, mode: 'insensitive' } },

              { fornecedorCnpj: { contains: q, mode: 'insensitive' } },

            ],

          }

        : {},

      include: {

        itens: { include: { medicamento: { select: { nome: true, principioAtivo: true } } } },

        criadoPor: { select: { nome: true } },

      },

      orderBy: [{ recebidaEm: 'desc' }],

      take: 200,

    })



    await auditarLgpd({

      usuarioId: sessao.usuario.id,

      role: sessao.usuario.role as never,

      atendimentoId: null,

      acao: 'LEITURA',

      entidade: 'TbFarmaciaEntradaNf',

      entidadeId: null,

      ipOrigem: req.headers.get('x-forwarded-for') ?? null,

      userAgent: req.headers.get('user-agent') ?? null,

      detalhes: { q: q || null, total: entradas.length },

    })



    return NextResponse.json({ sucesso: true, dados: entradas })

  } catch (e) {

    console.error('[GET /api/farmacia/entradas]', e)

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



    const entrada = await prisma.$transaction(async (tx) => {

      const created = await registrarEntradaNf(

        tx,

        {

          numeroNota: d.numeroNota,

          serie: d.serie,

          fornecedorNome: d.fornecedorNome,

          fornecedorCnpj: d.fornecedorCnpj,

          emitidaEm: d.emitidaEm,

          recebidaEm: d.recebidaEm,

          observacoes: d.observacoes,

          importadaXml: d.importadaXml,

          chaveNfe: d.chaveNfe,

          itens: d.itens,

        },

        sessao.usuario.id

      )



      await tx.tbAuditoriaLog.create({

        data: {

          usuarioId: sessao.usuario.id,

          role: sessao.usuario.role,

          atendimentoId: null,

          acao: 'CRIACAO',

          entidade: 'TbFarmaciaEntradaNf',

          entidadeId: created.id,

          ipOrigem: req.headers.get('x-forwarded-for') ?? null,

          userAgent: req.headers.get('user-agent') ?? null,

          detalhes: {

            numeroNota: created.numeroNota,

            serie: created.serie,

            importadaXml: d.importadaXml ?? false,

            totalItens: created.itens.length,

            totalQuantidade: created.itens.reduce((acc, x) => acc + x.quantidade, 0),

          },

        },

      })



      return created

    })



    return NextResponse.json({ sucesso: true, dados: entrada })

  } catch (e) {

    console.error('[POST /api/farmacia/entradas]', e)

    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 })

  }

}
