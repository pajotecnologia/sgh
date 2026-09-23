'use client'

import { useMemo } from 'react'
import {
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  User,
} from 'lucide-react'
import { parseResultadoExame, type ParametroExame } from '@/lib/exames-estruturados'
import { cn } from '@/lib/utils'

interface VisualizadorResultadoExameProps {
  resultadoTexto: string | null | undefined
  nomeExame: string
  resultadoPdf?: string | null
  realizadoEm?: string | Date | null
}

const BADGE_STATUS: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  NORMAL: {
    label: 'Normal',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  ABAIXO: {
    label: 'Abaixo',
    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
    icon: AlertTriangle,
  },
  ACIMA: {
    label: 'Acima',
    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
    icon: AlertTriangle,
  },
  CRITICO: {
    label: 'Crítico ⚠️',
    cls: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 animate-pulse',
    icon: AlertCircle,
  },
}

export function VisualizadorResultadoExame({
  resultadoTexto,
  nomeExame,
  resultadoPdf,
  realizadoEm,
}: VisualizadorResultadoExameProps) {
  const parsed = useMemo(() => parseResultadoExame(resultadoTexto), [resultadoTexto])

  if (!resultadoTexto && !resultadoPdf) {
    return (
      <span className="text-xs text-muted-foreground italic">
        Aguardando liberação do laudo / resultado.
      </span>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/80 bg-card p-3 text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <FlaskConical className="h-4 w-4 text-primary" />
          <span>{nomeExame}</span>
        </div>
        {realizadoEm && (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(realizadoEm).toLocaleString('pt-BR')}
          </span>
        )}
      </div>

      {/* Tabela de Parâmetros Estruturados */}
      {parsed.parametros && parsed.parametros.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-[11px] text-muted-foreground font-semibold">
                <th className="py-1.5 px-2">Parâmetro</th>
                <th className="py-1.5 px-2">Resultado</th>
                <th className="py-1.5 px-2">Unidade</th>
                <th className="py-1.5 px-2">Referência</th>
                <th className="py-1.5 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {parsed.parametros.map((param, idx) => {
                const badge = BADGE_STATUS[param.status] || BADGE_STATUS.NORMAL
                const Icone = badge.icon

                return (
                  <tr key={idx} className="hover:bg-muted/30">
                    <td className="py-1.5 px-2 font-medium text-foreground">{param.nome}</td>
                    <td className="py-1.5 px-2 font-bold tabular-nums text-foreground">
                      {param.valor}
                    </td>
                    <td className="py-1.5 px-2 text-muted-foreground">{param.unidade}</td>
                    <td className="py-1.5 px-2 text-muted-foreground">
                      {param.referenciaTexto || (param.referenciaMin !== null && param.referenciaMax !== null ? `${param.referenciaMin} - ${param.referenciaMax}` : '-')}
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold',
                          badge.cls
                        )}
                      >
                        <Icone className="h-3 w-3" />
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : parsed.textoLaudo ? (
        <div className="bg-muted/40 p-2.5 rounded text-xs whitespace-pre-wrap font-sans text-foreground">
          {parsed.textoLaudo}
        </div>
      ) : null}

      {/* Laudo Textual Adicional / Observações */}
      {parsed.parametros && parsed.parametros.length > 0 && parsed.textoLaudo && (
        <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Conclusão / Laudo: </span>
          {parsed.textoLaudo}
        </div>
      )}

      {/* Informações adicionais do laboratório */}
      {(parsed.metodo || parsed.responsavelTecnico) && (
        <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-muted-foreground">
          {parsed.metodo && <span>Método: {parsed.metodo}</span>}
          {parsed.responsavelTecnico && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Resp. Técnico: {parsed.responsavelTecnico}
            </span>
          )}
        </div>
      )}

      {/* Link para PDF se anexado */}
      {resultadoPdf && (
        <div className="pt-2 border-t border-border/60">
          <a
            href={resultadoPdf}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <FileText className="h-3.5 w-3.5" />
            Visualizar Laudo em PDF
          </a>
        </div>
      )}
    </div>
  )
}
