'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ClipboardList, History } from 'lucide-react'
import { cn } from '@/lib/utils'

type Aba = 'pendentes' | 'aplicadas'

export function NavegacaoAbasMedicacao({
  totalPendentes,
  totalAplicadas,
}: {
  totalPendentes: number
  totalAplicadas: number
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const abaAtual = (searchParams.get('aba') === 'aplicadas' ? 'aplicadas' : 'pendentes') as Aba
  const dias = searchParams.get('dias') ?? '7'

  const montarHref = (aba: Aba) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('aba', aba)
    if (aba === 'aplicadas') {
      if (!params.has('dias')) params.set('dias', dias)
    } else {
      params.delete('dias')
    }
    const q = params.toString()
    return `${pathname}${q ? `?${q}` : ''}`
  }

  const abas: { id: Aba; label: string; icon: typeof ClipboardList; total: number }[] = [
    { id: 'pendentes', label: 'Pendentes', icon: ClipboardList, total: totalPendentes },
    { id: 'aplicadas', label: 'Aplicadas', icon: History, total: totalAplicadas },
  ]

  return (
    <nav
      className="flex gap-1 p-1 bg-muted/50 border border-border rounded-lg"
      aria-label="Abas da medicação"
    >
      {abas.map(({ id, label, icon: Icon, total }) => {
        const ativo = abaAtual === id
        return (
          <Link
            key={id}
            href={montarHref(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors',
              ativo
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
            aria-current={ativo ? 'page' : undefined}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{label}</span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-[9px] font-bold',
                ativo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              {total}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
