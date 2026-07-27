// app/(dashboard)/farmacia/layout.tsx
// Layout do módulo Farmácia com submenus internos

import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { ClipboardCheck, Package, FileDown, FileUp, Tags, Upload, BarChart3 } from 'lucide-react'

export const metadata: Metadata = { title: { default: 'Farmácia', template: '%s | Farmácia' } }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

const SUBMENU = [
  { href: '/farmacia', label: 'Dispensação', icon: ClipboardCheck },
  { href: '/farmacia/medicamentos', label: 'Medicamentos', icon: Package },
  { href: '/farmacia/entradas', label: 'Entradas (NF)', icon: FileDown },
  { href: '/farmacia/entradas/importar-xml', label: 'Importar XML', icon: Upload },
  { href: '/farmacia/saidas', label: 'Saídas', icon: FileUp },
  { href: '/farmacia/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/farmacia/sinonimos', label: 'Sinônimos', icon: Tags },
]

export default async function LayoutFarmacia({ children }: { children: React.ReactNode }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  return (
    <div className="space-y-3">
      <nav className="no-print flex flex-wrap gap-2">
        {SUBMENU.map((it) => {
          const Icone = it.icon
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700',
                'hover:bg-slate-50 hover:text-slate-900'
              )}
              aria-label={it.label}
            >
              <Icone className="h-4 w-4 text-primary" aria-hidden />
              {it.label}
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}
