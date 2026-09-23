import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schemaStatusLeito = z.object({
  leitoId: z.string().uuid('ID do leito inválido'),
  status: z.enum(['DISPONIVEL', 'INTERDITADO']),
  motivo: z.string().min(2, 'Informe o motivo da alteração de status').optional(),
})

const ROLES_STATUS = ['ADMIN', 'ENFERMEIRO', 'DIRETOR_CLINICO']

export async function POST(req: NextRequest) {
  try {
    const sessao = await getServerSession(authOptions)
    if (!sessao) {
      return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
    }

    if (!ROLES_STATUS.includes(sessao.usuario.role)) {
      return NextResponse.json({ sucesso: false, erro: 'Sem permissão para alterar status do leito.' }, { status: 403 })
    }

    const body = await req.json()
    const validacao = schemaStatusLeito.safeParse(body)
    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: validacao.error.errors[0]?.message ?? 'Dados inválidos.' },
        { status: 400 }
      )
    }

    const { leitoId, status, motivo } = validacao.data

    const leito = await prisma.leito.findUnique({
      where: { id: leitoId },
      include: {
        atendimentos: {
          where: { status: 'INTERNADO' },
        },
      },
    })

    if (!leito) {
      return NextResponse.json({ sucesso: false, erro: 'Leito não encontrado.' }, { status: 404 })
    }

    if (status === 'INTERDITADO' && leito.atendimentos.length > 0) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não é possível interditar um leito que possui paciente internado. Realize a transferência antes.' },
        { status: 400 }
      )
    }

    const observacaoAtualizada = motivo
      ? `${leito.observacoes ? leito.observacoes + ' | ' : ''}${status === 'INTERDITADO' ? 'Interdição: ' : 'Liberação: '}${motivo}`
      : leito.observacoes

    const leitoAtualizado = await prisma.$transaction(async (tx) => {
      const atualizado = await tx.leito.update({
        where: { id: leitoId },
        data: {
          status,
          observacoes: observacaoAtualizada,
        },
      })

      await tx.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'ATUALIZACAO',
          entidade: 'Leito',
          entidadeId: leitoId,
          campo: 'status',
          valorAnterior: leito.status,
          valorNovo: `${status} (Motivo: ${motivo ?? 'Atualização de status'})`,
          ipOrigem: req.headers.get('x-forwarded-for') ?? '127.0.0.1',
          userAgent: req.headers.get('user-agent') ?? 'desconhecido',
        },
      })

      return atualizado
    })

    return NextResponse.json({
      sucesso: true,
      mensagem: `Status do leito atualizado para ${status}.`,
      dados: leitoAtualizado,
    })
  } catch (error: any) {
    console.error('[POST /api/internamento/mapa-leitos/status]', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao atualizar status do leito.' },
      { status: 500 }
    )
  }
}
