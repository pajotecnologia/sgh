import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Clock3, ListTodo } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { exigirPermissaoMenu } from '@/lib/exigir-permissao-menu'
import { obterPendenciasUsuario } from '@/lib/central-tarefas'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Minha Fila' }

export default async function MinhaFilaPage() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  await exigirPermissaoMenu('minha-fila')

  const dados = await obterPendenciasUsuario(sessao.usuario.id, sessao.usuario.role)

  const prioridadeLabel = {
    CRITICA: 'Crítica',
    ALTA: 'Alta',
    MEDIA: 'Média',
    BAIXA: 'Baixa',
  } as const

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary" />
            <h1 className="page-title">Minha Fila</h1>
          </div>
          <p className="page-subtitle">Pendências e próximas ações do seu perfil, organizadas por prioridade.</p>
        </div>
        <Link href="/dashboard" className="text-xs font-medium text-primary hover:underline">Voltar ao dashboard</Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card"><p className="text-[11px] text-muted-foreground">Total</p><p className="text-xl font-bold mt-1 tabular-nums">{dados.totalPendencias}</p></div>
        <div className="stat-card"><p className="text-[11px] text-muted-foreground">Críticas</p><p className="text-xl font-bold mt-1 tabular-nums text-rose-600">{dados.criticas}</p></div>
        <div className="stat-card"><p className="text-[11px] text-muted-foreground">Alta prioridade</p><p className="text-xl font-bold mt-1 tabular-nums">{dados.itens.filter((i) => i.prioridade === 'ALTA').length}</p></div>
        <div className="stat-card"><p className="text-[11px] text-muted-foreground">Pendências visíveis</p><p className="text-xl font-bold mt-1 tabular-nums">{dados.itens.length}</p></div>
      </div>

      {dados.itens.length === 0 ? (
        <section className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="mx-auto w-fit p-3 rounded-full bg-emerald-500/10 text-emerald-600"><ListTodo className="h-6 w-6" /></div>
          <h2 className="font-semibold mt-3">Nenhuma pendência</h2>
          <p className="text-xs text-muted-foreground mt-1">Não há tarefas pendentes para seu perfil neste momento.</p>
        </section>
      ) : (
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border">
            <h2 className="font-semibold">Próximas ações</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Clique em uma tarefa para abrir diretamente o fluxo correspondente.</p>
          </div>
          <div className="divide-y divide-border">
            {dados.itens.map((item) => (
              <Link key={item.id} href={item.href} className="flex items-center gap-3 p-4 sm:px-5 hover:bg-muted/40 transition-colors group">
                <div className={cn('w-1.5 self-stretch min-h-12 rounded-full shrink-0', item.prioridade === 'CRITICA' ? 'bg-rose-500' : item.prioridade === 'ALTA' ? 'bg-orange-500' : item.prioridade === 'MEDIA' ? 'bg-amber-400' : 'bg-slate-400')} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold truncate">{item.titulo}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">{prioridadeLabel[item.prioridade]}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitulo}</p>
                </div>
                {item.tempoEsperaFormatado && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground shrink-0"><Clock3 className="h-3 w-3" />{item.tempoEsperaFormatado}</span>
                )}
                <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Abrir</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
