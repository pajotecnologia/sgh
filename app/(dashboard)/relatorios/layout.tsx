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

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="page-title flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <BarChart3 className="h-7 w-7 text-primary" />
          Relatórios Gerenciais e Cadastros
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Exporte relatórios em PDF institucional ou CSV e consulte dados consolidados de todos os cadastros e atendimentos do sistema.
        </p>
      </div>

      <SubmenuRelatorios />
      
      <div>{children}</div>
    </div>
  )
}
