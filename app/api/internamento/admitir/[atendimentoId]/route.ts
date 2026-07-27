// GET — Dados do atendimento para a tela de admissão pela enfermagem

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { carregarSolicitacaoInternacao } from '@/lib/carregar-solicitacao-internacao'
import { carregarDadosFichaInternamento } from '@/lib/carregar-dados-ficha-internamento'

const ROLES = ['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA'] as const

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  }
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  try {
    const { atendimentoId } = await params

    const [solicitacao, dadosFicha] = await Promise.all([
      carregarSolicitacaoInternacao(atendimentoId),
      carregarDadosFichaInternamento(atendimentoId, {
        nome: sessao.usuario.nome,
        crm: sessao.usuario.crm,
      }),
    ])

    if (!solicitacao || !dadosFicha) {
      return NextResponse.json(
        { sucesso: false, erro: 'Atendimento não encontrado ou sem permissão para admissão.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      sucesso: true,
      dados: {
        solicitacao,
        prefill: dadosFicha.prefill,
        laudoExtra: dadosFicha.laudoExtra,
        paciente: dadosFicha.paciente,
      },
    })
  } catch (erro) {
    console.error('[GET /api/internamento/admitir/[atendimentoId]]', erro)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao carregar dados do atendimento.' },
      { status: 500 }
    )
  }
}
