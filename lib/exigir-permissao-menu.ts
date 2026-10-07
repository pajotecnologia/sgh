import { redirect } from 'next/navigation'
import type { Role } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { temPermissaoUsuario } from '@/lib/permissoes-usuario'
import type { ChavePermissao } from '@/lib/permissoes-menu'

export async function exigirPermissaoMenu(chave: ChavePermissao) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')

  const permitido = await temPermissaoUsuario(
    sessao.usuario.id,
    sessao.usuario.role as Role,
    chave
  )

  if (!permitido) redirect('/acesso-negado')
  return sessao
}
