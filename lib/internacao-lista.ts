import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { Role } from '@/types'

export const ROLES_LISTA_INTERNADOS: Role[] = [
  'ADMIN',
  'MEDICO',
  'DIRETOR_CLINICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'RECEPCIONISTA',
]

export type FiltrosListaInternados = {
  nome?: string
  prontuario?: string
  dataInicio?: string
  dataFim?: string
}

const montarIntervaloData = (dataInicioStr?: string, dataFimStr?: string) => {
  const intervalo: { gte?: Date; lte?: Date } = {}
  if (dataInicioStr) {
    const d = new Date(`${dataInicioStr}T00:00:00`)
    if (!Number.isNaN(d.getTime())) intervalo.gte = d
  }
  if (dataFimStr) {
    const d = new Date(`${dataFimStr}T23:59:59.999`)
    if (!Number.isNaN(d.getTime())) intervalo.lte = d
  }
  return intervalo
}

export const montarWhereInternacao = (
  filtros: FiltrosListaInternados
): Prisma.AtendimentoWhereInput => {
  const nome = filtros.nome?.trim() ?? ''
  const prontuario = filtros.prontuario?.trim() ?? ''
  const intervalo = montarIntervaloData(filtros.dataInicio, filtros.dataFim)

  const where: Prisma.AtendimentoWhereInput = {
    deletedAt: null,
    status: 'INTERNADO',
  }

  if (nome) {
    where.paciente = { nomeExibicao: { contains: nome, mode: 'insensitive' } }
  }

  if (prontuario) {
    where.numeroAtendimento = { contains: prontuario, mode: 'insensitive' }
  }

  if (intervalo.gte || intervalo.lte) {
    where.OR = [
      {
        prontuario: {
          encaminhamentos: {
            some: { tipo: 'INTERNACAO', createdAt: intervalo },
          },
        },
      },
      {
        AND: [
          {
            OR: [
              { prontuario: null },
              {
                prontuario: {
                  encaminhamentos: { none: { tipo: 'INTERNACAO' } },
                },
              },
            ],
          },
          { updatedAt: intervalo },
        ],
      },
    ]
  }

  return where
}

const includeListaInternados = {
  paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
  triagem: { select: { corClassificacao: true } },
  leito: { select: { ala: true, quarto: true, codigo: true, tipo: true } },
  laudoInternacao: { select: { status: true } },
  fichaCcih: { select: { status: true } },
  fichaMultidisciplinar: { select: { status: true } },
  fichaInternacaoAlta: { select: { status: true } },
  prontuario: {
    select: {
      encaminhamentos: {
        where: { tipo: 'INTERNACAO' as const },
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        select: { id: true, createdAt: true },
      },
      evolucoes: {
        orderBy: { registradoEm: 'desc' as const },
        take: 1,
        select: { registradoEm: true },
      },
      prescricoes: {
        select: {
          itens: {
            where: { status: 'PENDENTE' as const },
            select: { id: true },
          },
        },
      },
    },
  },
  fichasEvolucaoTurno: {
    where: { status: 'REGISTRADA' as const },
    orderBy: [{ registradoEm: 'desc' as const }, { updatedAt: 'desc' as const }],
    take: 1,
    select: { registradoEm: true, updatedAt: true },
  },
} satisfies Prisma.AtendimentoInclude

export type AtendimentoListaInternados = Prisma.AtendimentoGetPayload<{
  include: typeof includeListaInternados
}>

import { enriquecerPacienteComNomeCompleto } from '@/lib/nome-paciente-exibicao'

export const carregarListaInternados = async (
  filtros: FiltrosListaInternados,
  skip: number,
  take: number
) => {
  const where = montarWhereInternacao(filtros)

  const [atendimentosRaw, total] = await Promise.all([
    prisma.atendimento.findMany({
      where,
      include: includeListaInternados,
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
    }),
    prisma.atendimento.count({ where }),
  ])

  const atendimentos = atendimentosRaw.map((a) => ({
    ...a,
    paciente: enriquecerPacienteComNomeCompleto(a.paciente),
  }))

  return { atendimentos, total }
}
