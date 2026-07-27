import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schemaAtualizar = z.object({
  nome: z.string().min(1).max(120).optional(),
  descricao: z.string().max(500).optional().nullable(),
  ativo: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (sessao.usuario.role !== 'ADMIN') return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const validacao = schemaAtualizar.safeParse(body)
  if (!validacao.success) {
    return NextResponse.json(
      { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const d = validacao.data
    const clinica = await prisma.clinica.update({
      where: { id },
      data: {
        ...(d.nome ? { nome: d.nome.trim() } : {}),
        ...(d.descricao !== undefined ? { descricao: d.descricao ? d.descricao.trim() : null } : {}),
        ...(typeof d.ativo === 'boolean' ? { ativo: d.ativo } : {}),
      },
    })
    return NextResponse.json({ sucesso: true, dados: clinica })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ sucesso: false, erro: 'Já existe uma clínica com esse nome.' }, { status: 409 })
    }
    console.error('[PATCH /api/cadastros/clinicas/[id]]', e)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao atualizar clínica.' }, { status: 500 })
  }
}
