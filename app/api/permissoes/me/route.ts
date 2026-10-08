import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { obterPermissoesEfetivas } from '@/lib/permissoes-usuario'

export async function GET() {
  const sessao = await getServerSession(authOptions)
  if (!sessao?.usuario?.id || !sessao.usuario.role) {
    return NextResponse.json({ sucesso: false, erro: 'Sessão inválida ou expirada.' }, { status: 401 })
  }

  try {
    const permissoes = await obterPermissoesEfetivas(sessao.usuario.id, sessao.usuario.role)
    return NextResponse.json({ sucesso: true, dados: permissoes })
  } catch (erro) {
    console.error('[GET /api/permissoes/me]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Não foi possível carregar permissões.' }, { status: 500 })
  }
}
