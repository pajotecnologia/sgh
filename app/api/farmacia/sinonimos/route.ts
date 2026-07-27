// app/api/farmacia/sinonimos/route.ts
// CRUD simples para sinônimos de medicamento (ADMIN/FARMACEUTICO)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizarSinonimoParaBanco } from '@/lib/medicamento-catalogo-match'
import { auditarLgpd } from '@/lib/auditoria-lgpd'

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

const schemaCriar = z.object({
  medicamentoId: z.string().uuid(),
  sinonimo: z.string().min(2).max(120),
  ativo: z.boolean().optional(),
})

const schemaAtualizar = z.object({
  id: z.string().uuid(),
  ativo: z.boolean(),
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
    const medicamentoId = (url.searchParams.get('medicamentoId') ?? '').trim()

    const itens = await prisma.tbMedicamentoSinonimo.findMany({
      where: {
        AND: [
          medicamentoId ? { medicamentoId } : {},
          q
            ? {
                OR: [
                  { sinonimo: { contains: q, mode: 'insensitive' } },
                  { medicamento: { nome: { contains: q, mode: 'insensitive' } } },
                  { medicamento: { principioAtivo: { contains: q, mode: 'insensitive' } } },
                ],
              }
            : {},
        ],
      },
      include: { medicamento: true },
      orderBy: [{ updatedAt: 'desc' }],
      take: 250,
    })

    await auditarLgpd({
      usuarioId: sessao.usuario.id,
      role: sessao.usuario.role as never,
      atendimentoId: null,
      acao: 'LEITURA',
      entidade: 'TbMedicamentoSinonimo',
      entidadeId: null,
      ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null,
      detalhes: { q: q || null, medicamentoId: medicamentoId || null, total: itens.length },
    })

    return NextResponse.json({ sucesso: true, dados: itens })
  } catch (e) {
    console.error('[GET /api/farmacia/sinonimos]', e)
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
    const sinonimoNorm = normalizarSinonimoParaBanco(d.sinonimo)
    if (!sinonimoNorm) {
      return NextResponse.json({ sucesso: false, erro: 'Sinônimo inválido.' }, { status: 400 })
    }

    const criado = await prisma.tbMedicamentoSinonimo.create({
      data: {
        medicamentoId: d.medicamentoId,
        sinonimo: d.sinonimo.trim(),
        sinonimoNorm,
        ativo: d.ativo ?? true,
      },
      include: { medicamento: true },
    })

    await auditarLgpd({
      usuarioId: sessao.usuario.id,
      role: sessao.usuario.role as never,
      atendimentoId: null,
      acao: 'CRIACAO',
      entidade: 'TbMedicamentoSinonimo',
      entidadeId: criado.id,
      ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null,
      detalhes: { medicamentoId: d.medicamentoId, sinonimo: d.sinonimo.trim() },
    })

    return NextResponse.json({ sucesso: true, dados: criado })
  } catch (e) {
    console.error('[POST /api/farmacia/sinonimos]', e)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const validacao = schemaAtualizar.safeParse(body)
    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const d = validacao.data
    const atualizado = await prisma.tbMedicamentoSinonimo.update({
      where: { id: d.id },
      data: { ativo: d.ativo },
      include: { medicamento: true },
    })

    await auditarLgpd({
      usuarioId: sessao.usuario.id,
      role: sessao.usuario.role as never,
      atendimentoId: null,
      acao: 'ATUALIZACAO',
      entidade: 'TbMedicamentoSinonimo',
      entidadeId: atualizado.id,
      ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null,
      detalhes: { ativo: d.ativo },
    })

    return NextResponse.json({ sucesso: true, dados: atualizado })
  } catch (e) {
    console.error('[PATCH /api/farmacia/sinonimos]', e)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 })
  }
}
