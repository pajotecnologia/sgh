// app/api/atendimento/[atendimentoId]/evolucao-turno/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { startOfDay } from 'date-fns'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { schemaFichaEvolucaoTurno } from '@/lib/validations/evolucao-turno'
import {
  dadosFichaEvolucaoTurnoParaPrisma,
  inferirTurnoAtual,
  montarPrefillFichaEvolucaoTurno,
} from '@/lib/evolucao-turno-internacao'
import { prontuarioEstaEncerrado } from '@/lib/atendimento-prontuario'
import { includeAtendimentoInternacao } from '@/lib/prefill-internamento'

const ROLES_LEITURA = [
  'ADMIN',
  'MEDICO',
  'DIRETOR_CLINICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'RECEPCIONISTA',
] as const

const ROLES_ESCRITA = [
  'ADMIN',
  'MEDICO',
  'DIRETOR_CLINICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
] as const

const includeAtendimento = includeAtendimentoInternacao

function parseDataRef(s: string | null): Date {
  if (!s?.trim()) return startOfDay(new Date())
  const d = new Date(s.includes('T') ? s : `${s}T12:00:00`)
  return Number.isNaN(d.getTime()) ? startOfDay(new Date()) : startOfDay(d)
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params
  const sessao = await getServerSession(authOptions)
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  }
  if (!ROLES_LEITURA.includes(sessao.usuario.role as (typeof ROLES_LEITURA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  const turnoParam = req.nextUrl.searchParams.get('turno')
  const dataParam = req.nextUrl.searchParams.get('data')
  const turno =
    turnoParam === 'NOTURNA' || turnoParam === 'DIURNA' ? turnoParam : inferirTurnoAtual()
  const dataReferencia = parseDataRef(dataParam)

  try {
    const atendimento = await prisma.atendimento.findFirst({
      where: { id: atendimentoId, deletedAt: null, status: 'INTERNADO' },
      include: includeAtendimento,
    })

    if (!atendimento) {
      return NextResponse.json(
        { sucesso: false, erro: 'Atendimento não encontrado ou paciente não está internado.' },
        { status: 404 }
      )
    }

    const fichas = await prisma.fichaEvolucaoTurno.findMany({
      where: { atendimentoId },
      orderBy: [{ dataReferencia: 'desc' }, { turno: 'asc' }],
      take: 60,
      select: {
        id: true,
        turno: true,
        dataReferencia: true,
        status: true,
        nomeProfissional: true,
        conselhoProfissional: true,
        evolucaoClinica: true,
        registradoEm: true,
        updatedAt: true,
      },
    })

    const fichaAtual = await prisma.fichaEvolucaoTurno.findUnique({
      where: {
        atendimentoId_dataReferencia_turno: {
          atendimentoId,
          dataReferencia,
          turno,
        },
      },
    })

    const dataStr = dataReferencia.toISOString().slice(0, 10)
    const prefill = montarPrefillFichaEvolucaoTurno(
      atendimento,
      turno,
      dataStr,
      fichaAtual,
      { nome: sessao.usuario.nome, crm: sessao.usuario.crm, role: sessao.usuario.role }
    )

    return NextResponse.json({
      sucesso: true,
      dados: {
        prefill,
        fichas,
        paciente: {
          nomeExibicao: atendimento.paciente.nomeExibicao,
          numeroAtendimento: atendimento.numeroAtendimento,
        },
      },
    })
  } catch (erro) {
    console.error('[GET evolucao-turno]', erro)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao carregar evolução por turno.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params
  const sessao = await getServerSession(authOptions)
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  }
  if (!ROLES_ESCRITA.includes(sessao.usuario.role as (typeof ROLES_ESCRITA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  try {
    if (await prontuarioEstaEncerrado(atendimentoId)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Prontuário encerrado. Edição não permitida.' },
        { status: 409 }
      )
    }

    const atendimento = await prisma.atendimento.findFirst({
      where: { id: atendimentoId, deletedAt: null, status: 'INTERNADO' },
      select: { id: true },
    })

    if (!atendimento) {
      return NextResponse.json(
        { sucesso: false, erro: 'Atendimento não encontrado ou paciente não está internado.' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const validacao = schemaFichaEvolucaoTurno.safeParse(body)
    if (!validacao.success) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Dados inválidos.',
          detalhes: validacao.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const registrar = validacao.data.status === 'REGISTRADA'
    const dadosPrisma = dadosFichaEvolucaoTurnoParaPrisma(
      validacao.data,
      sessao.usuario.id,
      registrar
    )

    const dataRef = dadosPrisma.dataReferencia

    let ficha
    if (validacao.data.id) {
      const existente = await prisma.fichaEvolucaoTurno.findFirst({
        where: { id: validacao.data.id, atendimentoId },
      })
      if (!existente) {
        return NextResponse.json({ sucesso: false, erro: 'Ficha não encontrada.' }, { status: 404 })
      }
      ficha = await prisma.fichaEvolucaoTurno.update({
        where: { id: existente.id },
        data: dadosPrisma,
      })
      await prisma.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'ATUALIZACAO',
          entidade: 'FichaEvolucaoTurno',
          entidadeId: ficha.id,
          valorNovo: `${validacao.data.turno}-${validacao.data.status}`,
          ipOrigem: req.headers.get('x-forwarded-for') ?? null,
        },
      })
    } else {
      ficha = await prisma.fichaEvolucaoTurno.upsert({
        where: {
          atendimentoId_dataReferencia_turno: {
            atendimentoId,
            dataReferencia: dataRef,
            turno: validacao.data.turno,
          },
        },
        create: {
          atendimentoId,
          ...dadosPrisma,
        },
        update: dadosPrisma,
      })
      await prisma.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'CRIACAO',
          entidade: 'FichaEvolucaoTurno',
          entidadeId: ficha.id,
          valorNovo: `${validacao.data.turno}-${validacao.data.status}`,
          ipOrigem: req.headers.get('x-forwarded-for') ?? null,
        },
      })
    }

    return NextResponse.json({ sucesso: true, dados: ficha })
  } catch (erro) {
    console.error('[PUT evolucao-turno]', erro)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao salvar ficha de evolução.' },
      { status: 500 }
    )
  }
}
