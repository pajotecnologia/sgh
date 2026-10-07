'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Check, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

type TemaOpcao = 'light' | 'dark' | 'system'

const OPCOES: { id: TemaOpcao; label: string }[] = [
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Escuro' },
  { id: 'system', label: 'Sistema' },
]

export function SeletorTema() {
  const { theme, setTheme } = useTheme()
  const [montado, setMontado] = useState(false)
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    setMontado(true)
  }, [])

  if (!montado) {
    return <div className="h-9 w-9 rounded-lg border border-slate-700 bg-slate-800/60 animate-pulse" aria-hidden />
  }

  const temaAtual = (theme ?? 'system') as TemaOpcao
  const labelAtual = OPCOES.find((opcao) => opcao.id === temaAtual)?.label ?? 'Sistema'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        aria-expanded={aberto}
        aria-haspopup="menu"
        aria-label={`Selecionar aparência: ${labelAtual}`}
        title={`Aparência: ${labelAtual}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/60 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Palette className="h-4 w-4" aria-hidden />
      </button>

      {aberto ? (
        <div
          role="menu"
          aria-label="Selecionar aparência do sistema"
          className="absolute bottom-11 left-0 z-[70] min-w-36 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl"
        >
          {OPCOES.map((opcao) => {
            const ativo = temaAtual === opcao.id
            return (
              <button
                key={opcao.id}
                type="button"
                role="menuitemradio"
                aria-checked={ativo}
                onClick={() => {
                  setTheme(opcao.id)
                  setAberto(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                  ativo ? 'bg-primary text-primary-foreground' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <span>{opcao.label}</span>
                {ativo ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
