// app/api/farmacia/medicamentos/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auditarLgpd } from '@/lib/auditoria-lgpd'

const ROLES_LEITURA = ['ADMIN', 'FARMACEUTICO', 'MEDICO', 'DIRETOR_CLINICO'] as const
const ROLES_ESCRITA = ['ADMIN', 'FARMACEUTICO'] as const

const schemaCriar = z.object({
  nome: z.string().min(2).max(120),
  principioAtivo: z.string().min(2).max(180),
  forma: z.string().max(80).nullable().optional(),
  concentracao: z.string().max(80).nullable().optional(),
  unidade: z.string().max(40).nullable().optional(),
  codigoEan: z.string().max(40).nullable().optional(),
  codigoAnvisa: z.string().max(40).nullable().optional(),
  classeTerapeutica: z.string().max(120).nullable().optional(),
  viaAdministracao: z.string().max(60).nullable().optional(),
  mav: z.boolean().optional(),
  duplaChecagem: z.boolean().optional(),
  tipoControle: z.string().max(80).nullable().optional(),
  alertasAlergia: z.string().max(500).nullable().optional(),
  localizacaoFisica: z.string().max(150).nullable().optional(),
  temperaturaArmazenamento: z.string().max(100).nullable().optional(),
  saldoAtual: z.number().int().min(0).optional(),
  estoqueMinimo: z.number().int().min(0).optional(),
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
    const ativo = (url.searchParams.get('ativo') ?? 'true').trim() !== 'false'

    const meds = await prisma.tbMedicamento.findMany({
      where: {
        ativo,
        ...(q
          ? {
              OR: [
                { nome: { contains: q, mode: 'insensitive' } },
                { principioAtivo: { contains: q, mode: 'insensitive' } },
                { sinonimos: { some: { sinonimo: { contains: q, mode: 'insensitive' } } } },
              ],
            }
          : {}),
      },
      orderBy: [{ nome: 'asc' }],
      take: 500,
    })

    await auditarLgpd({
      usuarioId: sessao.usuario.id,
      role: sessao.usuario.role as never,
      atendimentoId: null,
      acao: 'LEITURA',
      entidade: 'TbMedicamento',
      entidadeId: null,
      ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null,
      detalhes: { q: q || null, ativo, total: meds.length },
    })

    return NextResponse.json({ sucesso: true, dados: meds })
  } catch (e) {
    console.error('[GET /api/farmacia/medicamentos]', e)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (!ROLES_ESCRITA.includes(sessao.usuario.role as (typeof ROLES_ESCRITA)[number])) {
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
    const med = await prisma.tbMedicamento.create({
      data: {
        nome: d.nome.trim(),
        principioAtivo: d.principioAtivo.trim(),
        forma: (d.forma ?? null) ? String(d.forma).trim() : null,
        concentracao: (d.concentracao ?? null) ? String(d.concentracao).trim() : null,
        unidade: (d.unidade ?? null) ? String(d.unidade).trim() : null,
        codigoEan: (d.codigoEan ?? null) ? String(d.codigoEan).trim() : null,
        codigoAnvisa: (d.codigoAnvisa ?? null) ? String(d.codigoAnvisa).trim() : null,
        classeTerapeutica: (d.classeTerapeutica ?? null) ? String(d.classeTerapeutica).trim() : null,
        viaAdministracao: (d.viaAdministracao ?? null) ? String(d.viaAdministracao).trim() : null,
        mav: d.mav ?? false,
        duplaChecagem: d.duplaChecagem ?? false,
        tipoControle: (d.tipoControle ?? null) ? String(d.tipoControle).trim() : null,
        alertasAlergia: (d.alertasAlergia ?? null) ? String(d.alertasAlergia).trim() : null,
        localizacaoFisica: (d.localizacaoFisica ?? null) ? String(d.localizacaoFisica).trim() : null,
        temperaturaArmazenamento: (d.temperaturaArmazenamento ?? null) ? String(d.temperaturaArmazenamento).trim() : null,
        saldoAtual: d.saldoAtual ?? 0,
        estoqueMinimo: d.estoqueMinimo ?? 0,
        saldoReservado: 0,
        ativo: true,
      },
    })

    await auditarLgpd({
      usuarioId: sessao.usuario.id,
      role: sessao.usuario.role as never,
      atendimentoId: null,
      acao: 'CRIACAO',
      entidade: 'TbMedicamento',
      entidadeId: med.id,
      ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null,
      detalhes: { nome: med.nome, principioAtivo: med.principioAtivo, saldoAtual: med.saldoAtual },
    })

    return NextResponse.json({ sucesso: true, dados: med })
  } catch (e) {
    console.error('[POST /api/farmacia/medicamentos]', e)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 })
  }
}
