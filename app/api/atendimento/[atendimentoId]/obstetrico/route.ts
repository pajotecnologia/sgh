// app/api/atendimento/[atendimentoId]/obstetrico/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ROLES_PERMITIDOS = ['ADMIN', 'ENFERMEIRO', 'MEDICO', 'DIRETOR_CLINICO'] as const

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params
  const sessao = await getServerSession(authOptions)
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  }
  if (!ROLES_PERMITIDOS.includes(sessao.usuario.role as (typeof ROLES_PERMITIDOS)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data: { obstetrico?: boolean; vaiInternar?: boolean } = {}
    if (typeof body.obstetrico === 'boolean') data.obstetrico = body.obstetrico
    if (typeof body.vaiInternar === 'boolean') data.vaiInternar = body.vaiInternar

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ sucesso: false, erro: 'Nada a atualizar.' }, { status: 400 })
    }

    const atendimento = await prisma.atendimento.findFirst({
      where: { id: atendimentoId, deletedAt: null },
      select: { id: true },
    })
    if (!atendimento) {
      return NextResponse.json({ sucesso: false, erro: 'Atendimento não encontrado.' }, { status: 404 })
    }

    const atualizado = await prisma.atendimento.update({
      where: { id: atendimentoId },
      data,
      select: { id: true, obstetrico: true, vaiInternar: true },
    })

    await prisma.logAuditoria.create({
      data: {
        usuarioId: sessao.usuario.id,
        acao: 'ATUALIZACAO',
        entidade: 'Atendimento',
        entidadeId: atendimentoId,
        valorNovo: JSON.stringify(data),
        ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      },
    })

    return NextResponse.json({ sucesso: true, dados: atualizado })
  } catch (erro) {
    console.error('[POST obstetrico]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao atualizar atendimento.' }, { status: 500 })
  }
}
