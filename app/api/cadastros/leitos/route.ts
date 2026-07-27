import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schemaCriar = z.object({
  clinicaId: z.string().uuid().optional().nullable(),
  ala: z.string().min(1).max(60),
  quarto: z.string().max(40).optional().nullable(),
  codigo: z.string().min(1).max(40),
  tipo: z.enum(['UTI', 'ENFERMARIA', 'ISOLAMENTO', 'OBSERVACAO']).optional(),
  status: z.enum(['DISPONIVEL', 'OCUPADO', 'INTERDITADO']).optional(),
  ativo: z.boolean().optional(),
  observacoes: z.string().max(500).optional().nullable(),
})

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  // Leitura de leitos: permite aos papéis que usam internamento.
  if (
    !['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'RECEPCIONISTA'].includes(
      sessao.usuario.role as any
    )
  ) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const ativo = (url.searchParams.get('ativo') ?? 'true').trim() !== 'false'
  const status = (url.searchParams.get('status') ?? '').trim()
  const tipo = (url.searchParams.get('tipo') ?? '').trim()

  const leitos = await prisma.leito.findMany({
    where: {
      ativo,
      ...(status === 'DISPONIVEL' || status === 'OCUPADO' || status === 'INTERDITADO' ? { status } : {}),
      ...(tipo === 'UTI' || tipo === 'ENFERMARIA' || tipo === 'ISOLAMENTO' || tipo === 'OBSERVACAO' ? { tipo } : {}),
      ...(q
        ? {
            OR: [
              { ala: { contains: q, mode: 'insensitive' } },
              { codigo: { contains: q, mode: 'insensitive' } },
              { quarto: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ ala: 'asc' }, { codigo: 'asc' }],
    take: 500,
  })

  return NextResponse.json({ sucesso: true, dados: leitos })
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
    const leito = await prisma.leito.create({
      data: {
        clinicaId: d.clinicaId || null,
        ala: d.ala.trim(),
        quarto: d.quarto?.trim() || null,
        codigo: d.codigo.trim(),
        tipo: d.tipo ?? 'ENFERMARIA',
        status: d.status ?? 'DISPONIVEL',
        ativo: d.ativo ?? true,
        observacoes: d.observacoes?.trim() || null,
      },
    })
    return NextResponse.json({ sucesso: true, dados: leito })
  } catch (e) {
    console.error('[POST /api/cadastros/leitos]', e)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao criar leito.' }, { status: 500 })
  }
}
