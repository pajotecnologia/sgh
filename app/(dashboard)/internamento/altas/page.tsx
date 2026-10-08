// Histórico de altas e desfechos — separado da lista de pacientes ativos

import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Archive, CalendarDays, ChevronRight, HeartPulse, Search, UserRound } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { exigirPermissaoMenu } from '@/lib/exigir-permissao-menu'
import { prisma } from '@/lib/prisma'
import { obterNomeCompletoPaciente } from '@/lib/nome-paciente-exibicao'
import { PaginacaoLista } from '@/components/shared/PaginacaoLista'
import { parsePaginacao } from '@/lib/paginacao'

export const metadata: Metadata = { title: 'Altas Hospitalares' }

const ROLES = [
  'ADMIN',
  'MEDICO',
  'DIRETOR_CLINICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'RECEPCIONISTA',
]

const montarIntervaloData = (inicio?: string, fim?: string) => {
  const intervalo: { gte?: Date; lte?: Date } = {}
  if (inicio) {
    const d = new Date(`${inicio}T00:00:00`)
    if (!Number.isNaN(d.getTime())) intervalo.gte = d
  }
  if (fim) {
    const d = new Date(`${fim}T23:59:59.999`)
    if (!Number.isNaN(d.getTime())) intervalo.lte = d
  }
  return intervalo
}

const rotuloStatus = (status: string) => {
  if (status === 'ALTA') return {
    label: 'Alta hospitalar',
    classe: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  }
  if (status === 'TRANSFERIDO') return {
    label: 'Transferido',
    classe: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
  }
  return {
    label: 'Óbito',
    classe: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  }
}

export default async function PaginaAltasHospitalares({
  searchParams,
}: {
  searchParams: Promise<{
    nome?: string
    prontuario?: string
    dataInicio?: string
    dataFim?: string
    pagina?: string
    porPagina?: string
  }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  await exigirPermissaoMenu('internamento-altas')
  if (!ROLES.includes(sessao.usuario.role)) redirect('/acesso-negado')

  const params = await searchParams
  const { pagina, porPagina, skip, take } = parsePaginacao(params)
  const nome = params.nome?.trim() ?? ''
  const prontuario = params.prontuario?.trim() ?? ''
  const dataInicio = params.dataInicio ?? ''
  const dataFim = params.dataFim ?? ''
  const intervalo = montarIntervaloData(dataInicio, dataFim)

  const where = {
    deletedAt: null,
    status: { in: ['ALTA', 'TRANSFERIDO', 'OBITO'] as const },
    ...(nome ? {
      paciente: { nomeExibicao: { contains: nome, mode: 'insensitive' as const } },
    } : {}),
    ...(prontuario ? {
      numeroAtendimento: { contains: prontuario, mode: 'insensitive' as const },
    } : {}),
    ...(intervalo.gte || intervalo.lte ? { updatedAt: intervalo } : {}),
  }

  const [atendimentos, total] = await Promise.all([
    prisma.atendimento.findMany({
      where,
      include: {
        paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
        medico: { select: { nome: true } },
        fichaInternacaoAlta: { select: { status: true, updatedAt: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
    }),
    prisma.atendimento.count({ where }),
  ])

  return (
    <div className="max-w-5xl mx-auto space-y-6 w-full min-w-0">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title flex flex-wrap items-center gap-2">
            <Archive className="h-6 w-6 text-primary" aria-hidden />
            <span>Altas Hospitalares</span>
          </h1>
          <p className="page-subtitle">
            Histórico separado dos pacientes ativos. Pacientes com desfecho final não aparecem mais na rotina de evolução clínica.
          </p>
        </div>
        <Link
          href="/prontuario"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50"
        >
          <HeartPulse className="h-4 w-4" aria-hidden />
          Pacientes ativos
        </Link>
      </header>

      <form method="get" className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Paciente</span>
            <div className="relative">
              <UserRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
              <input name="nome" defaultValue={nome} placeholder="Nome do paciente" className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm" />
            </div>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Atendimento / prontuário</span>
            <input name="prontuario" defaultValue={prontuario} placeholder="Número do atendimento" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">De</span>
            <input type="date" name="dataInicio" defaultValue={dataInicio} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Até</span>
            <input type="date" name="dataFim" defaultValue={dataFim} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
          <p className="text-xs text-muted-foreground">{total} desfecho(s) encontrado(s).</p>
          <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
            <Search className="h-4 w-4" aria-hidden />
            Consultar
          </button>
        </div>
      </form>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Histórico de desfechos
        </h2>

        {atendimentos.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
            Nenhum paciente encontrado no histórico de altas.
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {atendimentos.map((a) => {
              const nomePaciente = obterNomeCompletoPaciente(a.paciente.nomeExibicao, a.paciente.nomeCriptografado)
              const status = rotuloStatus(a.status)
              const dataDesfecho = a.fichaInternacaoAlta?.updatedAt ?? a.updatedAt

              return (
                <li key={a.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${status.classe}`}>
                          {status.label}
                        </span>
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                          {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dataDesfecho))}
                        </span>
                      </div>
                      <p className="font-semibold text-foreground break-words">{nomePaciente}</p>
                      <p className="text-sm font-mono text-muted-foreground mt-0.5">Atendimento: {a.numeroAtendimento}</p>
                      {a.medico?.nome ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          Médico responsável: <strong className="text-foreground">{a.medico.nome}</strong>
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={`/prontuario/${a.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5"
                    >
                      Consultar prontuário
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {total > 0 ? (
        <PaginacaoLista
          total={total}
          pagina={pagina}
          porPagina={porPagina}
          basePath="/internamento/altas"
          queryPreservar={{
            nome: nome || undefined,
            prontuario: prontuario || undefined,
            dataInicio: dataInicio || undefined,
            dataFim: dataFim || undefined,
          }}
        />
      ) : null}
    </div>
  )
}
