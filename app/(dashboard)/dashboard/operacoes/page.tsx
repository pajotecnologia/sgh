import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { Activity, AlertTriangle, BedDouble, ClipboardList, Clock3, Stethoscope } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { obterIndicadoresOperacionais } from '@/lib/operacoes-dashboard'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Centro de Operações' }

const icones = {
  'aguardando-triagem': ClipboardList,
  'em-triagem': Clock3,
  'aguardando-atendimento': Stethoscope,
  'criticos-hoje': AlertTriangle,
  'aguardando-internacao': BedDouble,
  internados: Activity,
} as const

export default async function PaginaOperacoes() {
  const sessao = await getServerSession(authOptions)
  const indicadores = await obterIndicadoresOperacionais()

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Centro de Operações</p>
        <h1 className="page-title mt-1">Fluxo hospitalar em tempo real</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão operacional das filas assistenciais e dos pontos que exigem atenção.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Indicadores operacionais">
        {indicadores.map((item) => {
          const Icone = icones[item.chave as keyof typeof icones]
          return (
            <a
              key={item.chave}
              href={item.href}
              className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.titulo}</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums">{item.valor}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.descricao}</p>
                </div>
                <div className={cn(
                  'rounded-xl p-3',
                  item.prioridade === 'critico' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' :
                  item.prioridade === 'atencao' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                  'bg-primary/10 text-primary'
                )}>
                  <Icone className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <span className="mt-4 inline-block text-xs font-semibold text-primary opacity-80 group-hover:opacity-100">
                Abrir fila →
              </span>
            </a>
          )
        })}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Fluxo recomendado</h2>
            <p className="text-xs text-muted-foreground">Acompanhe a transição sem perder o contexto assistencial.</p>
          </div>
          <span className="text-xs text-muted-foreground">Sessão: {sessao?.usuario.nome ?? 'Usuário'}</span>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-5">
          {[
            ['Recepção', '/recepcao'],
            ['Triagem', '/triagem'],
            ['Atendimento', '/atendimento'],
            ['Internação', '/internamento'],
            ['Prontuário', '/prontuario'],
          ].map(([label, href], index) => (
            <a key={href} href={href} className="rounded-xl border border-border p-4 text-sm font-medium hover:bg-muted/40">
              <span className="text-xs text-muted-foreground">0{index + 1}</span>
              <span className="mt-2 block">{label}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
