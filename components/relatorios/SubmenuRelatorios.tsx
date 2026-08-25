'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar,
  Users,
  Stethoscope,
  Building2,
  BedDouble,
  Package,
  Truck,
  ClipboardList,
  Navigation,
  Tags,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SUBMENU_RELATORIOS = [
  { href: '/relatorios/atendimentos', label: 'Atendimentos', icon: Calendar },
  { href: '/relatorios/pacientes', label: 'Pacientes', icon: Users },
  { href: '/relatorios/profissionais', label: 'Profissionais / Usuários', icon: Stethoscope },
  { href: '/relatorios/clinicas', label: 'Clínicas', icon: Building2 },
  { href: '/relatorios/leitos', label: 'Leitos', icon: BedDouble },
  { href: '/relatorios/medicamentos', label: 'Medicamentos', icon: Package },
  { href: '/relatorios/fornecedores', label: 'Fornecedores', icon: Truck },
  { href: '/relatorios/prescricoes-padrao', label: 'Prescrições Padrão', icon: ClipboardList },
  { href: '/relatorios/origens', label: 'Origens de Pacientes', icon: Navigation },
  { href: '/relatorios/sinonimos', label: 'Sinônimos (Farmácia)', icon: Tags },
]

export function SubmenuRelatorios() {
  const pathname = usePathname()

  return (
    <nav className="no-print flex flex-wrap gap-2 pb-2 border-b border-border/60" aria-label="Submenu de relatórios">
      {SUBMENU_RELATORIOS.map((it) => {
        const Icone = it.icon
        const ativo =
          pathname === it.href ||
          (it.href === '/relatorios/atendimentos' && pathname === '/relatorios') ||
          pathname.startsWith(`${it.href}/`)

        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
              ativo
                ? 'border-primary bg-primary/10 text-primary shadow-xs'
                : 'border-border bg-card text-foreground hover:bg-muted'
            )}
            aria-current={ativo ? 'page' : undefined}
          >
            <Icone className="h-4 w-4 shrink-0" aria-hidden />
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
