'use client'

import { cn } from '@/lib/utils'
import { PROTOCOLO_MANCHESTER } from '@/types'
import type { CorTriagem } from '@/types'

interface SeletorCorManchesterProps {
  value: CorTriagem | null
  onChange: (cor: CorTriagem) => void
  error?: string
  className?: string
}

export function SeletorCorManchester({
  value,
  onChange,
  error,
  className,
}: SeletorCorManchesterProps) {
  return (
    <div className={className}>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5"
        role="radiogroup"
        aria-label="Classificação Manchester"
      >
        {PROTOCOLO_MANCHESTER.map((cfg) => {
          const ativo = value === cfg.cor
          const tempo =
            cfg.tempoMaximoMinutos === null
              ? 'Sem prazo'
              : cfg.tempoMaximoMinutos === 0
                ? 'Imediato'
                : `≤ ${cfg.tempoMaximoMinutos} min`

          return (
            <button
              key={cfg.cor}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => onChange(cfg.cor)}
              className={cn(
                'relative flex flex-col gap-1 rounded-xl border-2 p-3 text-left transition-all duration-150 min-h-[5.5rem]',
                ativo
                  ? 'shadow-md scale-[1.02] z-10'
                  : 'border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-border'
              )}
              style={
                ativo
                  ? {
                      borderColor: cfg.corHex,
                      backgroundColor: `${cfg.corHex}20`,
                      boxShadow: `0 4px 14px ${cfg.corHex}33`,
                    }
                  : { borderLeftWidth: '5px', borderLeftColor: cfg.corHex }
              }
            >
              <div className="flex items-center gap-2 w-full">
                <span
                  className="h-4 w-4 shrink-0 rounded-full shadow-sm ring-2 ring-white/80"
                  style={{ backgroundColor: cfg.corHex }}
                  aria-hidden
                />
                <span
                  className="text-xs font-black uppercase tracking-wide leading-tight"
                  style={ativo ? { color: cfg.corHex } : undefined}
                >
                  {cfg.cor.charAt(0) + cfg.cor.slice(1).toLowerCase()}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-foreground leading-snug">
                {cfg.label}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">{tempo}</span>
              {ativo ? (
                <span
                  className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] font-bold"
                  style={{ backgroundColor: cfg.corHex }}
                  aria-hidden
                >
                  ✓
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      {error ? (
        <p className="text-xs text-destructive mt-2 font-medium">{error}</p>
      ) : null}
    </div>
  )
}
