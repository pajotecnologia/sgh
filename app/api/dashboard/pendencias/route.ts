import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { obterPendenciasUsuario } from '@/lib/central-tarefas'

export async function GET(req: NextRequest) {
  try {
    const sessao = await getServerSession(authOptions)
    if (!sessao) {
      return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
    }

    const pendencias = await obterPendenciasUsuario(sessao.usuario.id, sessao.usuario.role)

    return NextResponse.json({
      sucesso: true,
      dados: pendencias,
    })
  } catch (error) {
    console.error('[GET /api/dashboard/pendencias]', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao obter pendências do usuário.' },
      { status: 500 }
    )
  }
}
