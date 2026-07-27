'use client'

import { Printer, Pill } from 'lucide-react'
import { TabelaDuasColunasPrescricaoModelo } from '@/components/prescricao/TabelaDuasColunasPrescricaoModelo'
import type { ColunasPrescricaoModelo } from '@/lib/prescricao-modelo-colunas'
import { linhasDuasColunasFromItensVisualizacao } from '@/lib/prescricao-modelo-colunas'
import type { ItemPrescricaoVisualizacao } from '@/lib/relatorio-prescricao-dinamico'
import { cn } from '@/lib/utils'

type VisualizacaoPrescricaoModeloProps = {
  itens: ItemPrescricaoVisualizacao[]
  colunas?: ColunasPrescricaoModelo
  observacoesPadrao?: string | null
  className?: string
}

export function VisualizacaoPrescricaoModelo({
  itens,
  colunas,
  observacoesPadrao,
  className,
}: VisualizacaoPrescricaoModeloProps) {
  const linhas = linhasDuasColunasFromItensVisualizacao(itens)

  const handleImprimir = () => {
    window.print()
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Formulário em duas colunas — esquerda cadastrada, direita preenchida na prescrição.
        </p>
        <button
          type="button"
          onClick={handleImprimir}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          aria-label="Imprimir pré-visualização da prescrição"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden />
          Imprimir
        </button>
      </div>

      <article className="bg-card border border-border rounded-xl overflow-hidden shadow-sm print:shadow-none print:border-foreground/20">
        <div className="px-4 sm:px-5 py-3 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Pill className="h-4 w-4 text-primary shrink-0" aria-hidden />
            Prescrição médica / enfermagem
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {itens.length} {itens.length === 1 ? 'linha' : 'linhas'}
          </span>
        </div>

        {observacoesPadrao?.trim() ? (
          <div className="mx-4 sm:mx-5 mt-4 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200 mb-1">
              Orientações gerais (pré-preenchidas na prescrição)
            </p>
            <p className="text-sm text-amber-950 dark:text-amber-100 whitespace-pre-wrap">
              {observacoesPadrao.trim()}
            </p>
          </div>
        ) : null}

        {itens.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">
            Nenhuma linha cadastrada neste modelo.
          </p>
        ) : (
          <div className="p-4 sm:p-5">
            <TabelaDuasColunasPrescricaoModelo
              linhas={linhas}
              colunas={colunas}
              modo="cadastro"
            />
          </div>
        )}

        <p className="px-4 sm:px-5 py-3 text-[10px] text-muted-foreground border-t border-border print:text-foreground/70">
          Modelo de prescrição — uso interno. O médico preenche a coluna da direita ao prescrever no prontuário.
        </p>
      </article>
    </div>
  )
}
