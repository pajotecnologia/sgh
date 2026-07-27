'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

type TemaOpcao = 'light' | 'dark' | 'system'

const OPCOES: { id: TemaOpcao; label: string; icone: typeof Sun }[] = [
  { id: 'light', label: 'Branco', icone: Sun },
  { id: 'dark', label: 'Preto', icone: Moon },
  { id: 'system', label: 'Sistema', icone: Monitor },
]

export function SeletorTema({ compacto = false }: { compacto?: boolean }) {
  const { theme, setTheme } = useTheme()
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
  }, [])

  if (!montado) {
    return (
      <div
        className="h-8 w-[7.5rem] rounded-lg border border-border bg-muted/30 animate-pulse"
        aria-hidden
      />
    )
  }

  const temaAtual = (theme ?? 'system') as TemaOpcao

  return (
    <div
      className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5"
      role="group"
      aria-label="Aparência do sistema"
    >
      {OPCOES.map((opcao) => {
        const Icone = opcao.icone
        const ativo = temaAtual === opcao.id
        return (
          <button
            key={opcao.id}
            type="button"
            onClick={() => setTheme(opcao.id)}
            aria-pressed={ativo}
            aria-label={`Tema ${opcao.label}`}
            title={opcao.label}
            className={cn(
              'inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors min-w-[2rem] sm:min-w-[4.5rem]',
              ativo
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
            )}
          >
            <Icone className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className={cn(compacto && 'sr-only sm:not-sr-only', !compacto && 'hidden sm:inline')}>
              {opcao.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
