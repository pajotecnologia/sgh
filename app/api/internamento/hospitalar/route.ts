// app/api/internamento/hospitalar/route.ts
// GET — Lista todos os pacientes internados com filtros para a aba de Internamento Hospitalar

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { obterNomeCompletoPaciente } from '@/lib/nome-paciente-exibicao'
import { contarItensPendentes } from '@/lib/fila-medicacao'
import { descricaoLeitoInternacao } from '@/lib/prefill-internamento'

const ROLES = [
  'ADMIN',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'RECEPCIONISTA',
  'MEDICO',
  'DIRETOR_CLINICO',
] as const

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  }
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const nome = searchParams.get('nome')?.trim() || ''
  const prontuario = searchParams.get('prontuario')?.trim() || ''
  const dataInicioStr = searchParams.get('dataInicio') || ''
  const dataFimStr = searchParams.get('dataFim') || ''

  try {
    // Montagem do filtro where
    const where: any = {
      deletedAt: null,
      status: 'INTERNADO',
    }

    if (nome) {
      where.paciente = {
        nomeExibicao: { contains: nome, mode: 'insensitive' },
      }
    }

    if (prontuario) {
      where.numeroAtendimento = { contains: prontuario, mode: 'insensitive' }
    }

    const intervalo: { gte?: Date; lte?: Date } = {}
    if (dataInicioStr) {
      const d = new Date(`${dataInicioStr}T00:00:00`)
      if (!Number.isNaN(d.getTime())) intervalo.gte = d
    }
    if (dataFimStr) {
      const d = new Date(`${dataFimStr}T23:59:59.999`)
      if (!Number.isNaN(d.getTime())) intervalo.lte = d
    }

    if (intervalo.gte || intervalo.lte) {
      where.OR = [
        {
          prontuario: {
            encaminhamentos: {
              some: {
                tipo: 'INTERNACAO',
                createdAt: intervalo,
              },
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

    const atendimentos = await prisma.atendimento.findMany({
      where,
      include: {
        paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
        triagem: { select: { corClassificacao: true } },
        leito: { select: { ala: true, quarto: true, codigo: true, tipo: true } },
        laudoInternacao: { select: { status: true } },
        fichaCcih: { select: { status: true } },
        fichaMultidisciplinar: { select: { status: true } },
        medico: { select: { nome: true } },
        prontuario: {
          select: {
            encaminhamentos: {
              where: { tipo: 'INTERNACAO' },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { id: true, createdAt: true, especialidade: true, cidInternacao: true },
            },
            prescricoes: {
              select: {
                itens: {
                  where: { status: 'PENDENTE' },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    })

    const dados = atendimentos.map((a) => {
      const nomePaciente = obterNomeCompletoPaciente(
        a.paciente.nomeExibicao,
        a.paciente.nomeCriptografado
      )
      const encInternacao = a.prontuario?.encaminhamentos?.[0] ?? null
      const encaminhamentoInternacaoId = encInternacao?.id ?? null
      const dataInternacao = encInternacao?.createdAt ?? a.updatedAt
      const dosesPendentes = contarItensPendentes(a.prontuario?.prescricoes)

      return {
        atendimentoId: a.id,
        numeroAtendimento: a.numeroAtendimento,
        nomePaciente,
        corTriagem: a.triagem?.corClassificacao ?? null,
        internadoEm: dataInternacao.toISOString(),
        leito: descricaoLeitoInternacao(a.leito),
        setor: a.setor ?? '',
        tipoClinica: encInternacao?.especialidade ?? '',
        cidInternacao: encInternacao?.cidInternacao ?? '',
        medicoNome: a.medico?.nome ?? '—',
        statusLaudo: a.laudoInternacao?.status ?? null,
        statusCcih: a.fichaCcih?.status ?? null,
        statusMulti: a.fichaMultidisciplinar?.status ?? null,
        dosesPendentes,
        encaminhamentoId: encaminhamentoInternacaoId,
      }
    })

    return NextResponse.json({ sucesso: true, dados })
  } catch (erro) {
    console.error('[GET /api/internamento/hospitalar]', erro)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao listar internamentos hospitalares.' },
      { status: 500 }
    )
  }
}
