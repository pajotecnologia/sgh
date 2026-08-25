import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { STATUS_MEDICACAO_ATIVOS } from '@/lib/fila-medicacao'
import { enriquecerPacienteComNomeCompleto } from '@/lib/nome-paciente-exibicao'

export const dynamic = 'force-dynamic'

const ROLES = ['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'] as const

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params
  const sessao = await getServerSession(authOptions)
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  }
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  try {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const atendimento = await prisma.atendimento.findFirst({
      where: {
        id: atendimentoId,
        deletedAt: null,
        status: { in: STATUS_MEDICACAO_ATIVOS },
      },
      include: {
        paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
        triagem: { select: { corClassificacao: true } },
        medico: { select: { nome: true } },
        prontuario: {
          select: {
            prescricoes: {
              orderBy: { emitidaEm: 'desc' },
              select: {
                id: true,
                numeroPrescricao: true,
                emitidaEm: true,
                itens: {
                  orderBy: { createdAt: 'asc' },
                  select: {
                    id: true,
                    nomeMedicamento: true,
                    dose: true,
                    via: true,
                    frequencia: true,
                    status: true,
                    observacoes: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!atendimento?.prontuario) {
      return NextResponse.json(
        { sucesso: false, erro: 'Atendimento não encontrado ou não elegível para Medicação.' },
        { status: 404 }
      )
    }

    const itemIds = atendimento.prontuario.prescricoes.flatMap((p) => p.itens.map((i) => i.id))

    const aplicacoesRecentes = itemIds.length
      ? await prisma.aplicacaoMedicamento.findMany({
          where: {
            itemPrescricaoId: { in: itemIds },
            aplicadoEm: { gte: hoje },
          },
          orderBy: { aplicadoEm: 'desc' },
          take: 50,
          select: {
            id: true,
            doseAplicada: true,
            via: true,
            aplicadoEm: true,
            aplicadoPor: { select: { nome: true } },
            itemPrescricao: { select: { nomeMedicamento: true } },
          },
        })
      : []

    return NextResponse.json({
      sucesso: true,
      dados: {
        atendimento: {
          id: atendimento.id,
          numeroAtendimento: atendimento.numeroAtendimento,
          status: atendimento.status,
          paciente: enriquecerPacienteComNomeCompleto(atendimento.paciente),
          triagem: atendimento.triagem,
          medico: atendimento.medico,
        },
        prontuario: atendimento.prontuario,
        aplicacoesRecentes,
      },
    })
  } catch (erro) {
    console.error('[GET /api/medicacao/atendimentoId]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 })
  }
}
