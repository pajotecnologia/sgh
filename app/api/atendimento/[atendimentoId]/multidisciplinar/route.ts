// app/api/atendimento/[atendimentoId]/multidisciplinar/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { schemaFichaMultidisciplinar } from '@/lib/validations/multidisciplinar'
import { dadosFichaMultidisciplinarParaPrisma } from '@/lib/multidisciplinar-internacao'
import { carregarDadosFichaMultidisciplinar } from '@/lib/carregar-dados-ficha-multidisciplinar'

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
    const dados = await carregarDadosFichaMultidisciplinar(atendimentoId, {
      nome: sessao.usuario.nome,
      crm: sessao.usuario.crm,
      role: sessao.usuario.role,
    })

    if (!dados) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Atendimento não encontrado ou paciente não está internado.',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({ sucesso: true, dados })
  } catch (erro) {
    console.error('[GET multidisciplinar]', erro)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao carregar ficha multidisciplinar.' },
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
    const atendimento = await prisma.atendimento.findFirst({
      where: { id: atendimentoId, deletedAt: null, status: 'INTERNADO' },
      select: { id: true, fichaMultidisciplinar: { select: { id: true } } },
    })

    if (!atendimento) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Atendimento não encontrado ou paciente não está internado.',
        },
        { status: 404 }
      )
    }

    const body = await req.json()
    const validacao = schemaFichaMultidisciplinar.safeParse(body)
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

    const dadosPrisma = dadosFichaMultidisciplinarParaPrisma(
      validacao.data,
      sessao.usuario.id
    )

    let ficha
    if (atendimento.fichaMultidisciplinar) {
      ficha = await prisma.fichaMultidisciplinar.update({
        where: { id: atendimento.fichaMultidisciplinar.id },
        data: dadosPrisma,
      })
      await prisma.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'ATUALIZACAO',
          entidade: 'FichaMultidisciplinar',
          entidadeId: ficha.id,
          valorNovo: validacao.data.status,
          ipOrigem: req.headers.get('x-forwarded-for') ?? null,
        },
      })
    } else {
      ficha = await prisma.fichaMultidisciplinar.create({
        data: {
          atendimentoId,
          ...dadosPrisma,
        },
      })
      await prisma.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'CRIACAO',
          entidade: 'FichaMultidisciplinar',
          entidadeId: ficha.id,
          valorNovo: validacao.data.status,
          ipOrigem: req.headers.get('x-forwarded-for') ?? null,
        },
      })
    }

    return NextResponse.json({ sucesso: true, dados: ficha })
  } catch (erro) {
    console.error('[PUT multidisciplinar]', erro)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao salvar ficha multidisciplinar.' },
      { status: 500 }
    )
  }
}
