'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock3, ListTodo } from 'lucide-react'
import type { PendenciasUsuarioResultado } from '@/lib/central-tarefas'
import { cn } from '@/lib/utils'

const LABEL_ROLE: Record<string, string> = {
  ADMIN: 'operação administrativa',
  MEDICO: 'atendimento médico',
  DIRETOR_CLINICO: 'gestão clínica',
  ENFERMEIRO: 'enfermagem',
  TECNICO_ENFERMAGEM: 'enfermagem',
  RECEPCIONISTA: 'recepção',
  FARMACEUTICO: 'farmácia',
}

export function MinhaFilaResumo({ dados }: { dados: PendenciasUsuarioResultado }) {
  const primeira = dados.itens[0]
  const contexto = LABEL_ROLE[dados.role] ?? 'operação'

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <ListTodo className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold">Minha fila</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {contexto}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ações que merecem sua atenção agora, ordenadas por prioridade.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-2 rounded-lg bg-muted/60 border border-border">
            <strong className="tabular-nums">{dados.totalPendencias}</strong> pendência{dados.totalPendencias === 1 ? '' : 's'}
          </div>
          {dados.criticas > 0 && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 font-semibold">
              {dados.criticas} crítica{dados.criticas === 1 ? '' : 's'}
            </div>
          )}
          <Link href="/minha-fila" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Abrir fila
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="border-t border-border/70">
        {primeira ? (
          <Link href={primeira.href} className={cn('flex items-center justify-between gap-3 p-4 sm:px-5 hover:bg-muted/40 transition-colors group', primeira.prioridade === 'CRITICA' && 'bg-rose-50/40 dark:bg-rose-950/10')}>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Próxima ação recomendada</p>
              <p className="text-sm font-semibold truncate">{primeira.titulo}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{primeira.subtitulo}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {primeira.tempoEsperaFormatado && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock3 className="h-3 w-3" />
                  {primeira.tempoEsperaFormatado}
                </span>
              )}
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        ) : (
          <div className="p-5 flex items-center gap-3 text-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-semibold">Tudo em dia</p>
              <p className="text-xs text-muted-foreground">Não há tarefas pendentes para o seu perfil neste momento.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
