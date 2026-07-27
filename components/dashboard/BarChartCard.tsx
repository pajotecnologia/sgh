import { cn } from '@/lib/utils'
import type { ItemContagem } from '@/lib/dashboard-stats'

type BarChartCardProps = {
  titulo: string
  subtitulo?: string
  itens: ItemContagem[]
  vazio?: string
  className?: string
}

export function BarChartCard({
  titulo,
  subtitulo,
  itens,
  vazio = 'Sem dados no período selecionado.',
  className,
}: BarChartCardProps) {
  const max = Math.max(...itens.map((i) => i.valor), 1)

  return (
    <section className={cn('stat-card flex flex-col', className)}>
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">{titulo}</h3>
        {subtitulo ? <p className="text-xs text-muted-foreground mt-0.5">{subtitulo}</p> : null}
      </div>

      {itens.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{vazio}</p>
      ) : (
        <ul className="space-y-3" role="list">
          {itens.map((item) => {
            const pct = Math.round((item.valor / max) * 100)
            return (
              <li key={item.label}>
                <div className="flex items-center justify-between gap-2 text-xs mb-1">
                  <span className="font-medium text-foreground truncate" title={item.label}>
                    {item.label}
                  </span>
                  <span className="tabular-nums text-muted-foreground shrink-0">{item.valor}</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.cor ?? 'hsl(var(--primary))',
                    }}
                    role="presentation"
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
