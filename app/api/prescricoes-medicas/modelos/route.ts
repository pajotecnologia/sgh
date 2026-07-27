import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  listarPrescricoesMedicasPadraoAtivas,
  podeLerModelosPrescricaoMedica,
} from '@/lib/prescricoes-medicas-padrao'

/** Modelos de prescrição para uso clínico (prontuário / atendimento) */
export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  }

  const role = sessao.usuario.role as string
  if (!podeLerModelosPrescricaoMedica(role)) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()

  try {
    const modelos = await listarPrescricoesMedicasPadraoAtivas(prisma, { q })
    return NextResponse.json({ sucesso: true, dados: modelos })
  } catch (e) {
    console.error('[GET /api/prescricoes-medicas/modelos]', e)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao carregar modelos de prescrição.' },
      { status: 500 }
    )
  }
}
