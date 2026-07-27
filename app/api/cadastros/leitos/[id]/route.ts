import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schemaAtualizar = z.object({
  clinicaId: z.string().uuid().optional().nullable(),
  ala: z.string().min(1).max(60).optional(),
  quarto: z.string().max(40).optional().nullable(),
  codigo: z.string().min(1).max(40).optional(),
  tipo: z.enum(['UTI', 'ENFERMARIA', 'ISOLAMENTO', 'OBSERVACAO']).optional(),
  status: z.enum(['DISPONIVEL', 'OCUPADO', 'INTERDITADO']).optional(),
  ativo: z.boolean().optional(),
  observacoes: z.string().max(500).optional().nullable(),
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
    const leito = await prisma.leito.update({
      where: { id },
      data: {
        ...(d.clinicaId !== undefined ? { clinicaId: d.clinicaId || null } : {}),
        ...(d.ala ? { ala: d.ala.trim() } : {}),
        ...(d.quarto !== undefined ? { quarto: d.quarto ? d.quarto.trim() : null } : {}),
        ...(d.codigo ? { codigo: d.codigo.trim() } : {}),
        ...(d.tipo ? { tipo: d.tipo } : {}),
        ...(d.status ? { status: d.status } : {}),
        ...(typeof d.ativo === 'boolean' ? { ativo: d.ativo } : {}),
        ...(d.observacoes !== undefined ? { observacoes: d.observacoes ? d.observacoes.trim() : null } : {}),
      },
    })
    return NextResponse.json({ sucesso: true, dados: leito })
  } catch (e) {
    console.error('[PATCH /api/cadastros/leitos/[id]]', e)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao atualizar leito.' }, { status: 500 })
  }
}
