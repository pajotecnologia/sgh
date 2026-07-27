'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BedDouble, Building2, ClipboardList, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const SUBMENU = [
  { href: '/cadastros/clinicas', label: 'Clínicas', icon: Building2 },
  { href: '/cadastros/leitos', label: 'Leitos', icon: BedDouble },
  { href: '/cadastros/prescricoes-medicas', label: 'Prescrições Médicas', icon: ClipboardList },
  { href: '/cadastros/profissionais', label: 'Enfer./Técnicos/Médicos', icon: Users },
]

export function SubmenuCadastros() {
  const pathname = usePathname()

  return (
    <nav className="no-print flex flex-wrap gap-2" aria-label="Submenu de cadastros">
      {SUBMENU.map((it) => {
        const Icone = it.icon
        const ativo =
          pathname === it.href ||
          pathname.startsWith(`${it.href}/`)

        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
              ativo
                ? 'border-primary bg-primary/10 text-primary'
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
