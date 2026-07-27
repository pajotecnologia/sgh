// app/api/atendimento/[atendimentoId]/ficha-internacao-alta/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { schemaSalvarFichaInternacaoAlta } from '@/lib/validations/ficha-internacao-alta'
import { dadosFichaInternacaoAltaParaPrisma, mesclarFichaPorSecao } from '@/lib/ficha-internacao-alta'
import type { FichaInternacaoAltaForm } from '@/lib/validations/ficha-internacao-alta'
import { carregarDadosFichaInternacaoAlta } from '@/lib/carregar-dados-ficha-internacao-alta'

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
    const dados = await carregarDadosFichaInternacaoAlta(atendimentoId, {
      nome: sessao.usuario.nome,
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

    return NextResponse.json({ sucesso: true, dados })
  } catch (erro) {
    console.error('[GET ficha-internacao-alta]', erro)
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
      select: {
        id: true,
        fichaInternacaoAlta: { select: { id: true, dadosFormulario: true } },
      },
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
    const parsed = schemaSalvarFichaInternacaoAlta.safeParse(body)
    if (!parsed.success) {
      const detalhes = parsed.error.flatten().fieldErrors
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes },
        { status: 400 }
      )
    }

    const { secaoSalvar, ...dadosRecebidos } = parsed.data
    let dadosFinais = dadosRecebidos as FichaInternacaoAltaForm

    if (secaoSalvar === 'ALTA' && !atendimento.fichaInternacaoAlta) {
      const dadosCarregados = await carregarDadosFichaInternacaoAlta(atendimentoId, {
        nome: sessao.usuario.nome,
      })
      if (dadosCarregados) {
        dadosFinais = mesclarFichaPorSecao(dadosCarregados.prefill, dadosRecebidos, 'ALTA')
      }
    } else if (secaoSalvar && atendimento.fichaInternacaoAlta?.dadosFormulario) {
      const existente = atendimento.fichaInternacaoAlta.dadosFormulario as Partial<FichaInternacaoAltaForm>
      dadosFinais = mesclarFichaPorSecao(existente, dadosRecebidos, secaoSalvar)
    }

    const prismaData = dadosFichaInternacaoAltaParaPrisma(dadosFinais, sessao.usuario.id)

    if (atendimento.fichaInternacaoAlta) {
      await prisma.fichaInternacaoAlta.update({
        where: { id: atendimento.fichaInternacaoAlta.id },
        data: prismaData,
      })
    } else {
      await prisma.fichaInternacaoAlta.create({
        data: { ...prismaData, atendimentoId },
      })
    }

    return NextResponse.json({ sucesso: true })
  } catch (erro) {
    console.error('[PUT ficha-internacao-alta]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao salvar ficha.' }, { status: 500 })
  }
}
