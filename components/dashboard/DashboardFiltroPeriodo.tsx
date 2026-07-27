import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { PeriodoDashboard } from '@/lib/dashboard-stats'

const OPCOES: { valor: PeriodoDashboard; label: string }[] = [
  { valor: 'hoje', label: 'Hoje' },
  { valor: '7d', label: '7 dias' },
  { valor: '30d', label: '30 dias' },
  { valor: '90d', label: '90 dias' },
]

export function DashboardFiltroPeriodo({ periodoAtual }: { periodoAtual: PeriodoDashboard }) {
  return (
    <nav
      className="inline-flex flex-wrap gap-1 p-1 rounded-lg border border-border bg-muted/40"
      aria-label="Filtrar período do dashboard"
    >
      {OPCOES.map((op) => (
        <Link
          key={op.valor}
          href={op.valor === '30d' ? '/dashboard' : `/dashboard?periodo=${op.valor}`}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
            periodoAtual === op.valor
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background hover:text-foreground'
          )}
          aria-current={periodoAtual === op.valor ? 'page' : undefined}
        >
          {op.label}
        </Link>
      ))}
    </nav>
  )
}
