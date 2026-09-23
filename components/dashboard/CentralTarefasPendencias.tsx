'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ClipboardCheck,
  AlertCircle,
  Clock,
  RefreshCw,
  ChevronRight,
  Stethoscope,
  Pill,
  Users,
  FlaskConical,
  BedDouble,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import type { PendenciasUsuarioResultado, ItemPendenciaResumo } from '@/lib/central-tarefas'
import { BadgeManchester } from '@/components/triagem/BadgeManchester'
import { cn } from '@/lib/utils'

const ICONES_CATEGORIA = {
  MEDICO: Stethoscope,
  ENFERMAGEM: Pill,
  TRIAGEM: Users,
  EXAME: FlaskConical,
  INTERNACAO: BedDouble,
  FARMACIA: ClipboardCheck,
}

export function CentralTarefasPendencias({ dadosIniciais }: { dadosIniciais?: PendenciasUsuarioResultado }) {
  const [dados, setDados] = useState<PendenciasUsuarioResultado | null>(dadosIniciais ?? null)
  const [carregando, setCarregando] = useState(!dadosIniciais)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS')

  const recarregar = useCallback(async () => {
    try {
      setCarregando(true)
      const res = await fetch('/api/dashboard/pendencias')
      const json = await res.json()
      if (json.sucesso && json.dados) {
        setDados(json.dados)
      }
    } catch {
      toast.error('Erro ao atualizar pendências.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (!dadosIniciais) {
      recarregar()
    }
  }, [dadosIniciais, recarregar])

  if (!dados && carregando) {
    return (
      <div className="bg-card border border-border/80 rounded-xl p-6 flex items-center justify-center space-x-3">
        <RefreshCw className="h-5 w-5 text-primary animate-spin" />
        <span className="text-xs text-muted-foreground font-medium">Carregando central de pendências...</span>
      </div>
    )
  }

  if (!dados) return null

  const itensFiltrados = dados.itens.filter((item) => {
    if (filtroCategoria === 'TODAS') return true
    if (filtroCategoria === 'CRITICAS') return item.prioridade === 'CRITICA'
    return item.categoria === filtroCategoria
  })

  return (
    <div className="bg-card border border-border/80 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Cabeçalho da Central */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-foreground tracking-tight">
                Central de Tarefas & Pendências
              </h3>
              {dados.totalPendencias > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-sm">
                  {dados.totalPendencias}
                </span>
              )}
              {dados.criticas > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                  {dados.criticas} crítica{dados.criticas > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ações prioritárias e fluxos operacionais pendentes para o seu perfil.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={recarregar}
          disabled={carregando}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border border-border hover:bg-muted text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', carregando && 'animate-spin')} />
          Atualizar
        </button>
      </div>

      {/* Abas Rápidas de Filtro */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-b border-border/60 pb-3 text-xs">
        <button
          type="button"
          onClick={() => setFiltroCategoria('TODAS')}
          className={cn(
            'px-2.5 py-1 rounded-lg font-medium transition-colors',
            filtroCategoria === 'TODAS'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'hover:bg-muted text-muted-foreground'
          )}
        >
          Todas ({dados.totalPendencias})
        </button>

        {dados.criticas > 0 && (
          <button
            type="button"
            onClick={() => setFiltroCategoria('CRITICAS')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1',
              filtroCategoria === 'CRITICAS'
                ? 'bg-rose-600 text-white font-semibold shadow-xs'
                : 'hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/30'
            )}
          >
            <AlertCircle className="h-3 w-3" />
            Críticas ({dados.criticas})
          </button>
        )}

        {dados.resumoContadores.aguardandoMedico > 0 && (
          <button
            type="button"
            onClick={() => setFiltroCategoria('MEDICO')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-medium transition-colors',
              filtroCategoria === 'MEDICO'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'hover:bg-muted text-muted-foreground'
            )}
          >
            Aguardando Consulta ({dados.resumoContadores.aguardandoMedico})
          </button>
        )}

        {dados.resumoContadores.medicacoesPendentes > 0 && (
          <button
            type="button"
            onClick={() => setFiltroCategoria('ENFERMAGEM')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-medium transition-colors',
              filtroCategoria === 'ENFERMAGEM'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'hover:bg-muted text-muted-foreground'
            )}
          >
            Medicações ({dados.resumoContadores.medicacoesPendentes})
          </button>
        )}

        {dados.resumoContadores.examesComResultado > 0 && (
          <button
            type="button"
            onClick={() => setFiltroCategoria('EXAME')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-medium transition-colors',
              filtroCategoria === 'EXAME'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'hover:bg-muted text-muted-foreground'
            )}
          >
            Exames Liberados ({dados.resumoContadores.examesComResultado})
          </button>
        )}

        {dados.resumoContadores.admissoesPendentes > 0 && (
          <button
            type="button"
            onClick={() => setFiltroCategoria('INTERNACAO')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-medium transition-colors',
              filtroCategoria === 'INTERNACAO'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'hover:bg-muted text-muted-foreground'
            )}
          >
            Admissões ({dados.resumoContadores.admissoesPendentes})
          </button>
        )}

        {dados.resumoContadores.prescricoesFarmacia > 0 && (
          <button
            type="button"
            onClick={() => setFiltroCategoria('FARMACIA')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-medium transition-colors',
              filtroCategoria === 'FARMACIA'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'hover:bg-muted text-muted-foreground'
            )}
          >
            Farmácia ({dados.resumoContadores.prescricoesFarmacia})
          </button>
        )}
      </div>

      {/* Lista de Cards de Tarefas */}
      {itensFiltrados.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Sem pendências nesta categoria
          </p>
          <p className="text-xs text-muted-foreground">
            Todas as ações operacionais para o filtro selecionado foram atendidas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {itensFiltrados.map((item) => {
            const Icone = ICONES_CATEGORIA[item.categoria] || ClipboardCheck
            const critica = item.prioridade === 'CRITICA'

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'group rounded-xl border p-3 transition-all flex items-center justify-between gap-3 hover:border-primary/60 hover:shadow-sm',
                  critica
                    ? 'bg-rose-50/40 border-rose-200 dark:bg-rose-950/15 dark:border-rose-900/50'
                    : 'bg-card border-border/70 hover:bg-muted/30'
                )}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={cn(
                      'p-2 rounded-lg shrink-0 mt-0.5',
                      critica
                        ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                        : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'
                    )}
                  >
                    <Icone className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-foreground truncate block">
                        {item.titulo}
                      </span>
                      {item.corTriagem && (
                        <BadgeManchester cor={item.corTriagem} tamanho="sm" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {item.subtitulo}
                    </p>
                    {item.tempoEsperaFormatado && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>Aguardando há {item.tempoEsperaFormatado}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  <div className="p-1 rounded-md text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
