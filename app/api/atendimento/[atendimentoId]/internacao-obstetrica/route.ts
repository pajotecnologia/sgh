// app/api/atendimento/[atendimentoId]/internacao-obstetrica/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { schemaFichaInternacaoObstetrica } from '@/lib/validations/obstetricia'
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
      where: {
        id: atendimentoId,
        deletedAt: null,
        status: { in: ['AGUARDANDO_INTERNACAO', 'INTERNADO'] },
      },
      include: includeAtendimentoInternacao,
    })

    if (!atendimento) {
      return NextResponse.json(
        { sucesso: false, erro: 'Atendimento não encontrado ou paciente não está internado.' },
        { status: 404 }
      )
    }

    const ficha = await prisma.fichaInternacaoObstetrica.findUnique({ where: { atendimentoId } })
    const id = identificacaoPacienteInternacao(atendimento)

    // Pré-preenchimento do responsável a partir do cadastro da recepção
    const pacienteResp = await prisma.paciente.findFirst({
      where: { atendimentos: { some: { id: atendimentoId } } },
      select: {
        acompanhanteNome: true,
        acompanhanteTelefone: true,
        endereco: {
          select: { logradouro: true, numero: true, bairro: true, cidade: true, estado: true },
        },
      },
    })
    const e = pacienteResp?.endereco
    const enderecoTxt = e
      ? [e.logradouro, e.numero, e.bairro, e.cidade, e.estado].filter(Boolean).join(', ')
      : ''
    const responsavel = {
      resp_pessoa: pacienteResp?.acompanhanteNome ?? '',
      resp_fone: pacienteResp?.acompanhanteTelefone ?? '',
      resp_endereco: enderecoTxt,
    }

    return NextResponse.json({
      sucesso: true,
      dados: {
        prefill: {
          id: ficha?.id,
          nomePaciente: id.nomePaciente,
          numeroProntuario: id.numeroProntuario,
          leitoDescricao: id.leitoDescricao,
          campos: ficha?.campos ?? {},
          responsavel,
          trabalhoParto: ficha?.trabalhoParto ?? [],
          puerperio: ficha?.puerperio ?? [],
          recemNascido: ficha?.recemNascido ?? {},
          condicoesAlta: ficha?.condicoesAlta ?? {},
        },
        paciente: {
          nomeExibicao: atendimento.paciente.nomeExibicao,
          numeroAtendimento: atendimento.numeroAtendimento,
        },
      },
    })
  } catch (erro) {
    console.error('[GET internacao-obstetrica]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao carregar ficha.' }, { status: 500 })
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
    const atendimento = await prisma.atendimento.findFirst({
      where: {
        id: atendimentoId,
        deletedAt: null,
        status: { in: ['AGUARDANDO_INTERNACAO', 'INTERNADO'] },
      },
      select: { id: true },
    })

    if (!atendimento) {
      return NextResponse.json(
        { sucesso: false, erro: 'Atendimento não encontrado ou paciente não está internado.' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const validacao = schemaFichaInternacaoObstetrica.safeParse(body)
    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const dados = validacao.data
    const dadosPrisma = {
      campos: dados.campos ?? {},
      trabalhoParto: dados.trabalhoParto ?? [],
      puerperio: dados.puerperio ?? [],
      recemNascido: dados.recemNascido ?? {},
      condicoesAlta: dados.condicoesAlta ?? {},
      preenchidoPorId: sessao.usuario.id,
    }

    const ficha = await prisma.fichaInternacaoObstetrica.upsert({
      where: { atendimentoId },
      create: { atendimentoId, ...dadosPrisma },
      update: dadosPrisma,
    })

    await prisma.logAuditoria.create({
      data: {
        usuarioId: sessao.usuario.id,
        acao: 'ATUALIZACAO',
        entidade: 'FichaInternacaoObstetrica',
        entidadeId: ficha.id,
        ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      },
    })

    return NextResponse.json({ sucesso: true, dados: ficha })
  } catch (erro) {
    console.error('[PUT internacao-obstetrica]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao salvar ficha.' }, { status: 500 })
  }
}
