// app/api/atendimento/[atendimentoId]/sinais-vitais/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { startOfDay } from 'date-fns'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { schemaFichaSinaisVitais } from '@/lib/validations/sinais-vitais'
import { prontuarioEstaEncerrado } from '@/lib/atendimento-prontuario'
import {
  includeAtendimentoInternacao,
  identificacaoPacienteInternacao,
} from '@/lib/prefill-internamento'

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

  const dataReferencia = parseDataRef(req.nextUrl.searchParams.get('data'))

  try {
    const atendimento = await prisma.atendimento.findFirst({
      where: { id: atendimentoId, deletedAt: null, status: 'INTERNADO' },
      include: includeAtendimentoInternacao,
    })

    if (!atendimento) {
      return NextResponse.json(
        { sucesso: false, erro: 'Atendimento não encontrado ou paciente não está internado.' },
        { status: 404 }
      )
    }

    const fichas = await prisma.fichaSinaisVitais.findMany({
      where: { atendimentoId },
      orderBy: { dataReferencia: 'desc' },
      take: 60,
      select: { id: true, dataReferencia: true, updatedAt: true },
    })

    const fichaAtual = await prisma.fichaSinaisVitais.findUnique({
      where: { atendimentoId_dataReferencia: { atendimentoId, dataReferencia } },
    })

    const id = identificacaoPacienteInternacao(atendimento)
    const prefill = {
      id: fichaAtual?.id,
      dataReferencia: dataReferencia.toISOString().slice(0, 10),
      nomePaciente: id.nomePaciente,
      numeroProntuario: id.numeroProntuario,
      leitoDescricao: id.leitoDescricao,
      controleHorario: fichaAtual?.controleHorario ?? {},
      balancoHidrico: fichaAtual?.balancoHidrico ?? { ganhos: {}, perdas: {} },
    }

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
    console.error('[GET sinais-vitais]', erro)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao carregar ficha de sinais vitais.' },
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
    const validacao = schemaFichaSinaisVitais.safeParse(body)
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

    const dados = validacao.data
    const dataRef = parseDataRef(dados.dataReferencia)

    const dadosPrisma = {
      nomePaciente: dados.nomePaciente?.trim() || null,
      numeroProntuario: dados.numeroProntuario?.trim() || null,
      leitoDescricao: dados.leitoDescricao?.trim() || null,
      controleHorario: dados.controleHorario ?? {},
      balancoHidrico: dados.balancoHidrico ?? {},
      preenchidoPorId: sessao.usuario.id,
    }

    const ficha = await prisma.fichaSinaisVitais.upsert({
      where: { atendimentoId_dataReferencia: { atendimentoId, dataReferencia: dataRef } },
      create: { atendimentoId, dataReferencia: dataRef, ...dadosPrisma },
      update: dadosPrisma,
    })

    await prisma.logAuditoria.create({
      data: {
        usuarioId: sessao.usuario.id,
        acao: dados.id ? 'ATUALIZACAO' : 'CRIACAO',
        entidade: 'FichaSinaisVitais',
        entidadeId: ficha.id,
        ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      },
    })

    return NextResponse.json({ sucesso: true, dados: ficha })
  } catch (erro) {
    console.error('[PUT sinais-vitais]', erro)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao salvar ficha de sinais vitais.' },
      { status: 500 }
    )
  }
}
