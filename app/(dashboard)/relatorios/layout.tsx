import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { SubmenuRelatorios } from '@/components/relatorios/SubmenuRelatorios'
import { BarChart3 } from 'lucide-react'

export const metadata: Metadata = { title: { default: 'Relatórios', template: '%s | Relatórios' } }

const ROLES_RELATORIOS = ['ADMIN', 'DIRETOR_CLINICO', 'FARMACEUTICO'] as const

export default async function LayoutRelatorios({ children }: { children: React.ReactNode }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES_RELATORIOS.includes(sessao.usuario.role as any)) redirect('/acesso-negado')

  return <div className="w-full">{children}</div>
}
