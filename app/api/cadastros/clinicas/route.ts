import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schemaCriar = z.object({
  nome: z.string().min(1).max(120),
  descricao: z.string().max(500).optional().nullable(),
  ativo: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (
    !['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'RECEPCIONISTA'].includes(
      sessao.usuario.role as any
    )
  ) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const incluirInativas = url.searchParams.get('todas') === 'true'

  const clinicas = await prisma.clinica.findMany({
    where: {
      ...(incluirInativas ? {} : { ativo: true }),
      ...(q ? { nome: { contains: q, mode: 'insensitive' } } : {}),
    },
    orderBy: { nome: 'asc' },
    take: 500,
  })

  return NextResponse.json({ sucesso: true, dados: clinicas })
}

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (sessao.usuario.role !== 'ADMIN') return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })

  const body = await req.json()
  const validacao = schemaCriar.safeParse(body)
  if (!validacao.success) {
    return NextResponse.json(
      { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const d = validacao.data
    const clinica = await prisma.clinica.create({
      data: {
        nome: d.nome.trim(),
        descricao: d.descricao?.trim() || null,
        ativo: d.ativo ?? true,
      },
    })
    return NextResponse.json({ sucesso: true, dados: clinica })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ sucesso: false, erro: 'Já existe uma clínica com esse nome.' }, { status: 409 })
    }
    console.error('[POST /api/cadastros/clinicas]', e)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao criar clínica.' }, { status: 500 })
  }
}
