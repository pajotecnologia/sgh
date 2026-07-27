'use client'

import type { ElementType } from 'react'
import { Construction } from 'lucide-react'

export function AbaEmDesenvolvimento({
  titulo,
  descricao,
  icon: Icon = Construction,
}: {
  titulo: string
  descricao?: string
  icon?: ElementType
}) {
  return (
    <div className="bg-card border border-dashed border-border rounded-xl p-8 sm:p-12 text-center max-w-lg mx-auto">
      <Icon className="h-10 w-10 text-muted-foreground mx-auto mb-4" aria-hidden />
      <h3 className="text-lg font-semibold text-foreground">{titulo}</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
        {descricao ??
          'Módulo em implementação. Os dados do paciente internado já estão vinculados a este atendimento.'}
      </p>
    </div>
  )
}
