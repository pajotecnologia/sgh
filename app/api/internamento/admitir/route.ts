// POST — Enfermagem confirma recepção e interna o paciente (atribui leito)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { admitirPacienteInternacao } from '@/lib/admitir-paciente-internacao'

const ROLES = ['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA'] as const

const schema = z.object({
  atendimentoId: z.string().uuid(),
  leitoId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  }
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const validacao = schema.safeParse(body)
    if (!validacao.success) {
      return NextResponse.json({ sucesso: false, erro: 'Dados inválidos.' }, { status: 400 })
    }

    const resultado = await admitirPacienteInternacao(
      validacao.data.atendimentoId,
      validacao.data.leitoId,
      sessao.usuario.id
    )

    return NextResponse.json({ sucesso: true, dados: resultado })
  } catch (erro) {
    const msg = erro instanceof Error ? erro.message : 'Erro ao admitir paciente.'
    const status = msg.includes('não encontrado') || msg.includes('aguardando') ? 404 : 400
    console.error('[POST /api/internamento/admitir]', erro)
    return NextResponse.json({ sucesso: false, erro: msg }, { status })
  }
}
