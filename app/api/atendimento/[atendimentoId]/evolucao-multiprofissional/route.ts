// app/api/atendimento/[atendimentoId]/evolucao-multiprofissional/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { schemaNovaEvolucaoMultiprofissional } from '@/lib/validations/evolucao-multiprofissional'
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
  'FARMACEUTICO',
] as const

const ROLES_ESCRITA = [
  'ADMIN',
  'MEDICO',
  'DIRETOR_CLINICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'FARMACEUTICO',
] as const

function categoriaPorRole(role: string): string {
  if (role === 'MEDICO' || role === 'DIRETOR_CLINICO') return 'MEDICO'
  if (role === 'ENFERMEIRO' || role === 'TECNICO_ENFERMAGEM') return 'ENFERMEIRO'
  if (role === 'FARMACEUTICO') return 'FARMACIA'
  return 'OUTRO'
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

    const registros = await prisma.evolucaoMultiprofissional.findMany({
      where: { atendimentoId },
      orderBy: { dataHora: 'desc' },
      take: 200,
    })

    const id = identificacaoPacienteInternacao(atendimento)

    return NextResponse.json({
      sucesso: true,
      dados: {
        identificacao: {
          nomePaciente: id.nomePaciente,
          numeroProntuario: id.numeroProntuario,
          setorUnidade: id.setorUnidade,
          leitoDescricao: id.leitoDescricao,
          numeroAtendimento: atendimento.numeroAtendimento,
        },
        registros,
        usuario: {
          nome: sessao.usuario.nome,
          conselho: sessao.usuario.crm ?? sessao.usuario.coren ?? '',
          categoria: categoriaPorRole(sessao.usuario.role),
        },
      },
    })
  } catch (erro) {
    console.error('[GET evolucao-multiprofissional]', erro)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao carregar evolução multiprofissional.' },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const validacao = schemaNovaEvolucaoMultiprofissional.safeParse(body)
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
    const dataHora = new Date(dados.dataHora)
    if (Number.isNaN(dataHora.getTime())) {
      return NextResponse.json({ sucesso: false, erro: 'Data/hora inválida.' }, { status: 400 })
    }

    const registro = await prisma.evolucaoMultiprofissional.create({
      data: {
        atendimentoId,
        dataHora,
        evolucao: dados.evolucao.trim(),
        categoria: dados.categoria ?? categoriaPorRole(sessao.usuario.role),
        nomeProfissional: sessao.usuario.nome,
        conselho: sessao.usuario.crm || sessao.usuario.coren || null,
        registradoPorId: sessao.usuario.id,
      },
    })

    await prisma.logAuditoria.create({
      data: {
        usuarioId: sessao.usuario.id,
        acao: 'CRIACAO',
        entidade: 'EvolucaoMultiprofissional',
        entidadeId: registro.id,
        ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      },
    })

    return NextResponse.json({ sucesso: true, dados: registro }, { status: 201 })
  } catch (erro) {
    console.error('[POST evolucao-multiprofissional]', erro)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao salvar evolução multiprofissional.' },
      { status: 500 }
    )
  }
}
