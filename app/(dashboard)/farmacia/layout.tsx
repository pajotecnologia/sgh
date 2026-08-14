// app/(dashboard)/farmacia/layout.tsx
// Layout do módulo Farmácia com submenus internos

import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { ClipboardCheck, Package, FileDown, FileUp, Tags, Upload, BarChart3, Truck } from 'lucide-react'

export const metadata: Metadata = { title: { default: 'Farmácia', template: '%s | Farmácia' } }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

const SUBMENU_OPERACIONAL = [
  { href: '/farmacia', label: 'Dispensação', icon: ClipboardCheck },
  { href: '/farmacia/entradas', label: 'Entradas (NF)', icon: FileDown },
  { href: '/farmacia/entradas/importar-xml', label: 'Importar XML', icon: Upload },
  { href: '/farmacia/saidas', label: 'Saídas', icon: FileUp },
  { href: '/farmacia/relatorios', label: 'Relatórios', icon: BarChart3 },
]

const ATALHOS_CADASTROS = [
  { href: '/cadastros/medicamentos', label: 'Medicamentos', icon: Package },
  { href: '/cadastros/fornecedores', label: 'Fornecedores', icon: Truck },
  { href: '/cadastros/sinonimos', label: 'Sinônimos', icon: Tags },
]

export default async function LayoutFarmacia({ children }: { children: React.ReactNode }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  return (
    <div className="space-y-3">
      <nav className="no-print flex flex-wrap items-center gap-2">
        {SUBMENU_OPERACIONAL.map((it) => {
          const Icone = it.icon
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-xs font-semibold',
                'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
              )}
              aria-label={it.label}
            >
              <Icone className="h-4 w-4 text-primary" aria-hidden />
              {it.label}
            </Link>
          )
        })}

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" aria-hidden />

        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden md:inline">
          Cadastros:
        </span>

        {ATALHOS_CADASTROS.map((it) => {
          const Icone = it.icon
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 px-2.5 py-1.5 text-xs font-medium',
                'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground transition-colors'
              )}
              title={`Acessar Cadastro de ${it.label} no menu Cadastros`}
              aria-label={`Atalho para Cadastro de ${it.label}`}
            >
              <Icone className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden />
              {it.label}
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}
