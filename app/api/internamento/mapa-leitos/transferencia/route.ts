import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { descricaoLeitoInternacao } from '@/lib/prefill-internamento'

const schemaTransferencia = z.object({
  atendimentoId: z.string().uuid('ID do atendimento inválido'),
  leitoDestinoId: z.string().uuid('ID do leito de destino inválido'),
  motivo: z.string().min(3, 'Informe o motivo da transferência').optional(),
})

const ROLES_TRANSFERENCIA = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO']

export async function POST(req: NextRequest) {
  try {
    const sessao = await getServerSession(authOptions)
    if (!sessao) {
      return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
    }

    if (!ROLES_TRANSFERENCIA.includes(sessao.usuario.role)) {
      return NextResponse.json({ sucesso: false, erro: 'Sem permissão para transferir paciente de leito.' }, { status: 403 })
    }

    const body = await req.json()
    const validacao = schemaTransferencia.safeParse(body)
    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: validacao.error.errors[0]?.message ?? 'Dados inválidos.' },
        { status: 400 }
      )
    }

    const { atendimentoId, leitoDestinoId, motivo } = validacao.data

    // Buscar atendimento e leito atual
    const atendimento = await prisma.atendimento.findUnique({
      where: { id: atendimentoId },
      include: {
        paciente: { select: { id: true, nomeExibicao: true } },
        leito: { select: { id: true, ala: true, quarto: true, codigo: true } },
        laudoInternacao: { select: { id: true, autorizacao: true } },
      },
    })

    if (!atendimento) {
      return NextResponse.json({ sucesso: false, erro: 'Atendimento não encontrado.' }, { status: 404 })
    }

    if (atendimento.status !== 'INTERNADO') {
      return NextResponse.json(
        { sucesso: false, erro: 'Transferência de leito permitida apenas para pacientes internados.' },
        { status: 400 }
      )
    }

    if (atendimento.leitoId === leitoDestinoId) {
      return NextResponse.json(
        { sucesso: false, erro: 'O paciente já está alocado no leito selecionado.' },
        { status: 400 }
      )
    }

    // Executar transferência atômica no banco de dados
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Verificar e travar leito de destino
      const leitoDestino = await tx.leito.findUnique({
        where: { id: leitoDestinoId },
        select: { id: true, ativo: true, status: true, ala: true, quarto: true, codigo: true, tipo: true },
      })

      if (!leitoDestino || !leitoDestino.ativo) {
        throw new Error('Leito de destino inexistente ou inativo.')
      }

      if (leitoDestino.status !== 'DISPONIVEL') {
        throw new Error('Leito de destino não está disponível.')
      }

      // 2. Ocupar leito de destino
      const ocupouDestino = await tx.leito.updateMany({
        where: { id: leitoDestinoId, status: 'DISPONIVEL', ativo: true },
        data: { status: 'OCUPADO' },
      })

      if (ocupouDestino.count === 0) {
        throw new Error('Leito de destino foi ocupado concomitantemente por outro usuário.')
      }

      // 3. Liberar leito de origem
      if (atendimento.leitoId) {
        await tx.leito.updateMany({
          where: { id: atendimento.leitoId, status: 'OCUPADO' },
          data: { status: 'DISPONIVEL' },
        })
      }

      // 4. Atualizar atendimento com novo leito
      const atendimentoAtualizado = await tx.atendimento.update({
        where: { id: atendimentoId },
        data: { leitoId: leitoDestinoId },
        include: {
          leito: { select: { ala: true, quarto: true, codigo: true, tipo: true } },
        },
      })

      // 5. Atualizar laudo de internação se houver
      if (atendimentoAtualizado.leito && atendimento.laudoInternacao) {
        const leitoDesc = descricaoLeitoInternacao(atendimentoAtualizado.leito)
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

      // 6. Registrar na auditoria
      await tx.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'ATUALIZACAO',
          entidade: 'Atendimento',
          entidadeId: atendimentoId,
          campo: 'leitoId',
          valorAnterior: atendimento.leito ? `${atendimento.leito.ala} - ${atendimento.leito.codigo}` : 'Sem leito',
          valorNovo: `${leitoDestino.ala} - ${leitoDestino.codigo} (Motivo: ${motivo ?? 'Transferência de leito'})`,
          ipOrigem: req.headers.get('x-forwarded-for') ?? '127.0.0.1',
          userAgent: req.headers.get('user-agent') ?? 'desconhecido',
        },
      })

      return {
        atendimentoAtualizado,
        leitoDestino,
      }
    })

    return NextResponse.json({
      sucesso: true,
      mensagem: `Paciente transferido com sucesso para ${resultado.leitoDestino.ala} - ${resultado.leitoDestino.codigo}.`,
      dados: resultado,
    })
  } catch (error: any) {
    console.error('[POST /api/internamento/mapa-leitos/transferencia]', error)
    return NextResponse.json(
      { sucesso: false, erro: error.message || 'Erro ao processar transferência de leito.' },
      { status: error.message?.includes('não está disponível') ? 409 : 500 }
    )
  }
}
