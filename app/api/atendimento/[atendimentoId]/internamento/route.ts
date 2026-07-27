// app/api/atendimento/[atendimentoId]/internamento/route.ts
// GET — pré-preenchimento do laudo | PUT — salvar laudo de internação

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { schemaLaudoInternacao } from '@/lib/validations/internamento'
import { dadosLaudoParaPrisma } from '@/lib/laudo-internacao'
import { carregarDadosFichaInternamento } from '@/lib/carregar-dados-ficha-internamento'

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
  'RECEPCIONISTA',
] as const

export async function GET(
  _req: NextRequest,
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
    const dados = await carregarDadosFichaInternamento(atendimentoId, {
      nome: sessao.usuario.nome,
      crm: sessao.usuario.crm,
    })

    if (!dados) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Atendimento não encontrado ou paciente não está em processo de internação.',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      sucesso: true,
      dados: {
        prefill: dados.prefill,
        laudo: dados.laudoExtra,
        paciente: dados.paciente,
      },
    })
  } catch (erro) {
    console.error('[GET internamento]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao carregar laudo.' }, { status: 500 })
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
        status: { in: ['INTERNADO', 'AGUARDANDO_INTERNACAO'] },
      },
      select: { id: true, laudoInternacao: { select: { id: true, status: true } } },
    })

    if (!atendimento) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Atendimento não encontrado ou paciente não está em processo de internação.',
        },
        { status: 404 }
      )
    }

    const body = await req.json()
    const validacao = schemaLaudoInternacao.safeParse(body)
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

    const dadosPrisma = dadosLaudoParaPrisma(validacao.data, sessao.usuario.id)

    let laudo
    if (atendimento.laudoInternacao) {
      laudo = await prisma.laudoInternacao.update({
        where: { id: atendimento.laudoInternacao.id },
        data: dadosPrisma,
      })
      await prisma.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'ATUALIZACAO',
          entidade: 'LaudoInternacao',
          entidadeId: laudo.id,
          valorNovo: validacao.data.status,
          ipOrigem: req.headers.get('x-forwarded-for') ?? null,
        },
      })
    } else {
      laudo = await prisma.laudoInternacao.create({
        data: {
          atendimentoId,
          ...dadosPrisma,
        },
      })
      await prisma.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'CRIACAO',
          entidade: 'LaudoInternacao',
          entidadeId: laudo.id,
          valorNovo: validacao.data.status,
          ipOrigem: req.headers.get('x-forwarded-for') ?? null,
        },
      })
    }

    return NextResponse.json({ sucesso: true, dados: laudo })
  } catch (erro) {
    console.error('[PUT internamento]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao salvar laudo.' }, { status: 500 })
  }
}
