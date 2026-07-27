// app/api/atendimento/[atendimentoId]/bercario/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { schemaFichaBercario } from '@/lib/validations/obstetricia'
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

    const ficha = await prisma.fichaBercario.findUnique({ where: { atendimentoId } })
    const id = identificacaoPacienteInternacao(atendimento)

    return NextResponse.json({
      sucesso: true,
      dados: {
        prefill: {
          id: ficha?.id,
          nomePaciente: id.nomePaciente,
          numeroProntuario: id.numeroProntuario,
          leitoDescricao: id.leitoDescricao,
          campos: ficha?.campos ?? {},
          evolucao: ficha?.evolucao ?? [],
        },
        paciente: {
          nomeExibicao: atendimento.paciente.nomeExibicao,
          numeroAtendimento: atendimento.numeroAtendimento,
        },
      },
    })
  } catch (erro) {
    console.error('[GET bercario]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao carregar ficha de berçário.' }, { status: 500 })
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
    const validacao = schemaFichaBercario.safeParse(body)
    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const dados = validacao.data
    const dadosPrisma = {
      campos: dados.campos ?? {},
      evolucao: dados.evolucao ?? [],
      preenchidoPorId: sessao.usuario.id,
    }

    const ficha = await prisma.fichaBercario.upsert({
      where: { atendimentoId },
      create: { atendimentoId, ...dadosPrisma },
      update: dadosPrisma,
    })

    await prisma.logAuditoria.create({
      data: {
        usuarioId: sessao.usuario.id,
        acao: 'ATUALIZACAO',
        entidade: 'FichaBercario',
        entidadeId: ficha.id,
        ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      },
    })

    return NextResponse.json({ sucesso: true, dados: ficha })
  } catch (erro) {
    console.error('[PUT bercario]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao salvar ficha de berçário.' }, { status: 500 })
  }
}
