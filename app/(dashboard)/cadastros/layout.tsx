import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { SubmenuCadastros } from '@/components/cadastros/SubmenuCadastros'

export const metadata: Metadata = { title: { default: 'Cadastros', template: '%s | Cadastros' } }

const ROLES_CADASTROS = ['ADMIN', 'FARMACEUTICO'] as const

export default async function LayoutCadastros({ children }: { children: React.ReactNode }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES_CADASTROS.includes(sessao.usuario.role as any)) redirect('/acesso-negado')

  return (
    <div className="space-y-3">
      <SubmenuCadastros />
      {children}
    </div>
  )
}
