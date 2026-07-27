'use client'

import { cn } from '@/lib/utils'

export const inputLeituraCls =
  'w-full border border-input rounded-lg px-3 py-2 text-sm bg-muted/40 text-foreground cursor-default'

type CampoIdentificacaoLeituraProps = {
  label: string
  value: string
  className?: string
  mono?: boolean
  col?: string
}

export function CampoIdentificacaoLeitura({
  label,
  value,
  className,
  mono,
  col,
}: CampoIdentificacaoLeituraProps) {
  return (
    <div className={col}>
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <input
        type="text"
        readOnly
        tabIndex={-1}
        value={value || '—'}
        aria-readonly="true"
        className={cn(inputLeituraCls, 'mt-1', mono && 'font-mono', className)}
      />
    </div>
  )
}
