import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { descricaoLeitoInternacao } from '@/lib/prefill-internamento'

const schema = z.object({
  atendimentoId: z.string().uuid(),
  leitoId: z.string().uuid().nullable(),
})

const ROLES = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'RECEPCIONISTA'] as const

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (!ROLES.includes(sessao.usuario.role as any)) return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) {
    return NextResponse.json({ sucesso: false, erro: 'Dados inválidos.' }, { status: 400 })
  }

  const { atendimentoId, leitoId } = v.data

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: atendimentoId },
    select: {
      id: true,
      status: true,
      leitoId: true,
      laudoInternacao: { select: { id: true, autorizacao: true } },
    },
  })
  if (!atendimento) return NextResponse.json({ sucesso: false, erro: 'Atendimento não encontrado.' }, { status: 404 })
  if (atendimento.status !== 'INTERNADO') {
    return NextResponse.json({ sucesso: false, erro: 'Leito só pode ser definido para paciente internado.' }, { status: 400 })
  }

  const atualizado = await prisma.$transaction(async (tx) => {
    // Liberar leito anterior, se houver
    if (atendimento.leitoId && atendimento.leitoId !== leitoId) {
      await tx.leito.updateMany({
        where: { id: atendimento.leitoId, status: 'OCUPADO' },
        data: { status: 'DISPONIVEL' },
      })
    }

    if (leitoId) {
      const leito = await tx.leito.findUnique({
        where: { id: leitoId },
        select: { id: true, ativo: true, status: true, ala: true, quarto: true, codigo: true, tipo: true },
      })
      if (!leito || !leito.ativo) {
        return NextResponse.json({ sucesso: false, erro: 'Leito inválido ou inativo.' }, { status: 400 }) as never
      }
      if (leito.status !== 'DISPONIVEL') {
        return NextResponse.json(
          { sucesso: false, erro: 'Leito indisponível. Selecione um leito disponível.' },
          { status: 409 }
        ) as never
      }

      // Ocupar o leito (garantia contra concorrência)
      const ocupou = await tx.leito.updateMany({
        where: { id: leitoId, status: 'DISPONIVEL', ativo: true },
        data: { status: 'OCUPADO' },
      })
      if (ocupou.count === 0) {
        return NextResponse.json(
          { sucesso: false, erro: 'Leito foi ocupado por outro usuário. Atualize a tela e tente novamente.' },
          { status: 409 }
        ) as never
      }
    }

    const atualizado = await tx.atendimento.update({
      where: { id: atendimentoId },
      data: { leitoId },
      include: {
        leito: { select: { ala: true, quarto: true, codigo: true, tipo: true } },
      },
    })

    if (atualizado.leito && atendimento.laudoInternacao) {
      const leitoDesc = descricaoLeitoInternacao(atualizado.leito)
      const autAtual = (atendimento.laudoInternacao.autorizacao ?? {}) as Record<string, unknown>
      await tx.laudoInternacao.update({
        where: { id: atendimento.laudoInternacao.id },
        data: {
          autorizacao: {
            ...autAtual,
            enfermariaLeito: leitoDesc,
          },
        },
      })
    }

    return atualizado
  })

  return NextResponse.json({ sucesso: true, dados: atualizado })
}
