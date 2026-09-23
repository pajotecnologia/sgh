import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Activity, AlertTriangle, ClipboardCheck, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { obterIndicadoresGovernanca } from '@/lib/governanca-dashboard'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Governança e Segurança' }

export default async function PaginaGovernanca() {
  const sessao = await getServerSession(authOptions)

  if (!sessao || !['ADMIN', 'DIRETOR_CLINICO'].includes(sessao.usuario.role)) {
    redirect('/acesso-negado')
  }

  const indicadores = await obterIndicadoresGovernanca()

  const cards = [
    ['Acessos a pacientes hoje', indicadores.acessosPacienteHoje, ClipboardCheck],
    ['Eventos de auditoria hoje', indicadores.auditoriasHoje, ShieldCheck],
    ['Falhas de login hoje', indicadores.falhasLoginHoje, AlertTriangle],
    ['Sessões ativas', indicadores.sessoesAtivas, Activity],
    ['Eventos MFA hoje', indicadores.eventosMfaHoje, KeyRound],
  ] as const

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Fase 3 · Governança</p>
        <h1 className="page-title mt-1">Segurança, auditoria e LGPD</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão operacional dos controles de acesso e rastreabilidade de dados sensíveis.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {cards.map(([titulo, valor, Icon]) => (
          <div key={titulo} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums">{valor}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-2">
            <LockKeyhole className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <h2 className="font-semibold">Últimos acessos a dados de pacientes</h2>
              <p className="text-xs text-muted-foreground">Rastreabilidade para investigação e conformidade.</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
          {indicadores.acessosSensíveisRecentes.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Nenhum acesso registrado.</p>
          ) : (
            indicadores.acessosSensíveisRecentes.map((item) => (
              <div key={item.id} className="grid gap-1 p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-medium">{item.usuarioNome}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.acao}{item.modulo ? ` · ${item.modulo}` : ''} · paciente protegido
                  </p>
                </div>
                <time className="text-xs text-muted-foreground" dateTime={item.acessadoEm.toISOString()}>
                  {item.acessadoEm.toLocaleString('pt-BR')}
                </time>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
