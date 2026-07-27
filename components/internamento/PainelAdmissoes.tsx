'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  Activity,
  BedDouble,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Loader2,
  Pill,
  Printer,
  RefreshCw,
  Search,
  Shield,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import type {
  AdmissaoPendenteItem,
  FichaHospitalarItem,
  PacienteInternadoItem,
} from '@/lib/admissoes-pendentes'
import { mensagemInternacaoIncompleta } from '@/lib/internacao-completude'
import { BadgeManchester } from '@/components/triagem/BadgeManchester'
import { cn } from '@/lib/utils'
import { EnvoltorioListaPaginada } from '@/components/shared/EnvoltorioListaPaginada'
import type { CorTriagem } from '@/types'

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

function BadgeStatus({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    AGUARDANDO_INTERNACAO: {
      label: 'Aguardando',
      cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    },
    INTERNADO: {
      label: 'Internado',
      cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    },
  }
  const { label, cls } = cfg[status] ?? { label: status, cls: 'bg-muted text-muted-foreground' }
  return (
    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cls)}>{label}</span>
  )
}

function BadgeFicha({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded border whitespace-nowrap', cls)}>
      {label}
    </span>
  )
}

function getStatusLaudo(status: string | null) {
  if (status === 'AUTORIZADO') {
    return {
      label: 'Laudo autorizado',
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800/60',
    }
  }
  if (status === 'SOLICITADO') {
    return {
      label: 'Laudo solicitado',
      cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800/60',
    }
  }
  if (status) {
    return {
      label: 'Laudo rascunho',
      cls: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/60',
    }
  }
  return {
    label: 'Sem laudo SUS',
    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800/60',
  }
}

function getStatusMultidisciplinar(status: string | null) {
  if (status === 'CONCLUIDA') {
    return {
      label: 'Multi. concluída',
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800/60',
    }
  }
  if (status === 'EM_ANDAMENTO') {
    return {
      label: 'Multi. em andamento',
      cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800/60',
    }
  }
  if (status) {
    return {
      label: 'Multi. rascunho',
      cls: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/60',
    }
  }
  return {
    label: 'Sem multi.',
    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800/60',
  }
}

function getStatusFichaHospitalar(status: string | null) {
  if (status === 'CONCLUIDA') {
    return {
      label: 'Ficha concluída',
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800/60',
    }
  }
  if (status === 'EM_ANDAMENTO') {
    return {
      label: 'Ficha em andamento',
      cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800/60',
    }
  }
  if (status === 'RASCUNHO') {
    return {
      label: 'Ficha rascunho',
      cls: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/60',
    }
  }
  return {
    label: 'Sem ficha hospitalar',
    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800/60',
  }
}

function getStatusCcih(status: string | null) {
  if (status === 'CONCLUIDO') {
    return {
      label: 'CCIH concluída',
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800/60',
    }
  }
  if (status === 'NOTIFICADO' || status === 'EM_ANALISE') {
    return {
      label: 'CCIH notificada',
      cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800/60',
    }
  }
  if (status) {
    return {
      label: 'CCIH rascunho',
      cls: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/60',
    }
  }
  return {
    label: 'Sem ficha CCIH',
    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800/60',
  }
}

export type HospitalarItem = {
  atendimentoId: string
  numeroAtendimento: string
  nomePaciente: string
  corTriagem: CorTriagem | null
  internadoEm: string
  leito: string
  setor: string
  tipoClinica: string
  cidInternacao: string
  medicoNome: string
  statusLaudo: string | null
  statusCcih: string | null
  statusMulti: string | null
  dosesPendentes: number
  encaminhamentoId: string | null
}

export function PainelAdmissoes() {
  const { data: sessao } = useSession()
  const role = sessao?.usuario?.role ?? ''
  const podeVerMedicacaoPendente = ['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'].includes(role)

  const [abaAtiva, setAbaAtiva] = useState<
    'pendentes' | 'recentes' | 'fichaHospitalar' | 'hospitalar'
  >('pendentes')

  // Listas locais de admissões pendentes e aceitas
  const [pendentes, setPendentes] = useState<AdmissaoPendenteItem[]>([])
  const [internados, setInternados] = useState<PacienteInternadoItem[]>([])
  const [fichasHospitalares, setFichasHospitalares] = useState<FichaHospitalarItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null)

  // Estado para aba de Internamento Hospitalar
  const [hospitalar, setHospitalar] = useState<HospitalarItem[]>([])
  const [carregandoHospitalar, setCarregandoHospitalar] = useState(false)
  const [filtroNome, setFiltroNome] = useState('')
  const [filtroProntuario, setFiltroProntuario] = useState('')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')

  const carregarAdmissoes = async () => {
    setCarregando(true)
    try {
      const res = await fetch('/api/internamento/admissoes')
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao carregar admissões.')
        setPendentes([])
        setInternados([])
        setFichasHospitalares([])
        return
      }
      setPendentes(json.dados?.pendentes ?? [])
      setInternados(json.dados?.internados ?? [])
      setFichasHospitalares(json.dados?.fichasHospitalares ?? [])
      setUltimaAtualizacao(new Date())
    } catch {
      toast.error('Erro de conexão.')
      setPendentes([])
      setInternados([])
      setFichasHospitalares([])
    } finally {
      setCarregando(false)
    }
  }

  const fetchHospitalarComFiltros = async (
    nome: string,
    pront: string,
    inicio: string,
    fim: string
  ) => {
    setCarregandoHospitalar(true)
    try {
      const q = new URLSearchParams()
      if (nome.trim()) q.set('nome', nome.trim())
      if (pront.trim()) q.set('prontuario', pront.trim())
      if (inicio) q.set('dataInicio', inicio)
      if (fim) q.set('dataFim', fim)

      const res = await fetch(`/api/internamento/hospitalar?${q.toString()}`)
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao carregar internamento hospitalar.')
        setHospitalar([])
        return
      }
      setHospitalar(json.dados ?? [])
    } catch {
      toast.error('Erro de conexão.')
      setHospitalar([])
    } finally {
      setCarregandoHospitalar(false)
    }
  }

  const carregarHospitalar = () => {
    fetchHospitalarComFiltros(filtroNome, filtroProntuario, filtroDataInicio, filtroDataFim)
  }

  const handlePesquisarHospitalar = (e: React.FormEvent) => {
    e.preventDefault()
    carregarHospitalar()
  }

  const handleLimparHospitalar = () => {
    setFiltroNome('')
    setFiltroProntuario('')
    setFiltroDataInicio('')
    setFiltroDataFim('')
    setTimeout(() => {
      fetchHospitalarComFiltros('', '', '', '')
    }, 0)
  }

  useEffect(() => {
    carregarAdmissoes()
  }, [])

  const termo = normalizar(busca)

  const pendentesFiltrados = useMemo(() => {
    if (!termo) return pendentes
    return pendentes.filter(
      (p) =>
        normalizar(p.nomePaciente).includes(termo) ||
        normalizar(p.numeroAtendimento).includes(termo)
    )
  }, [pendentes, termo])

  const internadosFiltrados = useMemo(() => {
    if (!termo) return internados
    return internados.filter(
      (p) =>
        normalizar(p.nomePaciente).includes(termo) ||
        normalizar(p.numeroAtendimento).includes(termo)
    )
  }, [internados, termo])

  const fichasHospitalaresFiltradas = useMemo(() => {
    if (!termo) return fichasHospitalares
    return fichasHospitalares.filter(
      (p) =>
        normalizar(p.nomePaciente).includes(termo) ||
        normalizar(p.numeroAtendimento).includes(termo)
    )
  }, [fichasHospitalares, termo])

  return (
    <div className="space-y-6">
      {/* Abas Superiores */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto pb-0" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={abaAtiva === 'pendentes'}
            onClick={() => setAbaAtiva('pendentes')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0',
              abaAtiva === 'pendentes'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <Clock className="h-4 w-4 shrink-0 text-amber-500" />
            Aguardando Recepção
            <span
              className={cn(
                'ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0',
                abaAtiva === 'pendentes'
                  ? 'bg-primary/25 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {pendentesFiltrados.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={abaAtiva === 'recentes'}
            onClick={() => setAbaAtiva('recentes')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0',
              abaAtiva === 'recentes'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            Admitidos Recentemente
            <span
              className={cn(
                'ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0',
                abaAtiva === 'recentes'
                  ? 'bg-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {internadosFiltrados.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={abaAtiva === 'fichaHospitalar'}
            onClick={() => setAbaAtiva('fichaHospitalar')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0',
              abaAtiva === 'fichaHospitalar'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <ClipboardList className="h-4 w-4 shrink-0 text-violet-500" />
            Ficha Internação e Alta
            <span
              className={cn(
                'ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0',
                abaAtiva === 'fichaHospitalar'
                  ? 'bg-violet-500/25 text-violet-600 dark:text-violet-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {fichasHospitalaresFiltradas.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={abaAtiva === 'hospitalar'}
            onClick={() => {
              setAbaAtiva('hospitalar')
              if (hospitalar.length === 0) {
                carregarHospitalar()
              }
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0',
              abaAtiva === 'hospitalar'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <BedDouble className="h-4 w-4 shrink-0 text-blue-500" />
            Internamento Hospitalar
            {hospitalar.length > 0 && (
              <span
                className={cn(
                  'ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0',
                  abaAtiva === 'hospitalar'
                    ? 'bg-blue-500/25 text-blue-600 dark:text-blue-400'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {hospitalar.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Exibição da Busca Geral (Apenas para abas locais pendentes/recentes) */}
      {abaAtiva !== 'hospitalar' && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome do paciente ou nº do atendimento…"
              aria-label="Buscar paciente"
              className="w-full rounded-lg border border-input bg-background pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {busca ? (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={carregarAdmissoes}
            disabled={carregando}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors shrink-0"
            aria-label="Atualizar lista"
          >
            <RefreshCw className={cn('h-4 w-4', carregando && 'animate-spin')} aria-hidden />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      )}

      {/* Conteúdo da Aba 1: Aguardando Recepção */}
      {abaAtiva === 'pendentes' && (
        <div className="space-y-4">
          {carregando && !ultimaAtualizacao ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
              <p className="text-sm">Carregando admissões…</p>
            </div>
          ) : (
            <>
              {ultimaAtualizacao && (
                <p className="text-xs text-muted-foreground">
                  Atualizado{' '}
                  {formatDistanceToNow(ultimaAtualizacao, { addSuffix: true, locale: ptBR })}
                </p>
              )}

              {pendentesFiltrados.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm space-y-2">
                  <UserPlus className="h-8 w-8 mx-auto text-muted-foreground/40" aria-hidden />
                  <p>
                    {termo
                      ? 'Nenhuma solicitação encontrada para a busca.'
                      : 'Não há pacientes aguardando recepção no momento.'}
                  </p>
                </div>
              ) : (
                <EnvoltorioListaPaginada
                  items={pendentesFiltrados}
                  chaveReset={`pendentes-${termo}-${pendentesFiltrados.length}`}
                >
                  {(fatia) => (
                <ul className="space-y-2">
                  {fatia.map((item) => (
                    <li
                      key={item.atendimentoId}
                      className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground text-base">
                            {item.nomePaciente}
                          </p>
                          <BadgeStatus status="AGUARDANDO_INTERNACAO" />
                          {item.corTriagem ? (
                            <BadgeManchester cor={item.corTriagem} size="sm" />
                          ) : null}
                        </div>
                        <p className="text-sm font-mono text-muted-foreground mt-0.5">
                          Atendimento {item.numeroAtendimento}
                        </p>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            <span className="font-medium text-foreground">Clínica:</span>{' '}
                            {item.tipoClinica || '—'}
                          </span>
                          <span>
                            <span className="font-medium text-foreground">CID:</span>{' '}
                            {item.cidInternacao || '—'} · {item.medicoNome}
                          </span>
                          <span>
                            <span className="font-medium text-foreground">Solicitado em:</span>{' '}
                            {format(new Date(item.solicitadoEm), 'dd/MM/yyyy HH:mm')}
                          </span>
                          {item.prioridade ? (
                            <span>
                              <span className="font-medium text-foreground">Prioridade:</span>{' '}
                              {item.prioridade}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Link
                        href={`/internamento/admitir/${item.atendimentoId}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 shrink-0 transition-opacity shadow-sm"
                        aria-label={`Receber e internar ${item.nomePaciente}`}
                      >
                        <UserPlus className="h-4 w-4" aria-hidden />
                        Receber paciente
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  </li>
                  ))}
                </ul>
                  )}
                </EnvoltorioListaPaginada>
              )}
            </>
          )}
        </div>
      )}

      {/* Conteúdo da Aba 2: Admitidos Recentemente */}
      {abaAtiva === 'recentes' && (
        <div className="space-y-4">
          {carregando && !ultimaAtualizacao ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
              <p className="text-sm">Carregando admissões…</p>
            </div>
          ) : (
            <>
              {ultimaAtualizacao && (
                <p className="text-xs text-muted-foreground">
                  Atualizado{' '}
                  {formatDistanceToNow(ultimaAtualizacao, { addSuffix: true, locale: ptBR })}
                </p>
              )}

              {internadosFiltrados.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm space-y-2">
                  <BedDouble className="h-8 w-8 mx-auto text-muted-foreground/40" aria-hidden />
                  <p>
                    {termo
                      ? 'Nenhum paciente internado encontrado para a busca.'
                      : 'Nenhum paciente admitido recentemente.'}
                  </p>
                </div>
              ) : (
                <EnvoltorioListaPaginada
                  items={internadosFiltrados}
                  chaveReset={`recentes-${termo}-${internadosFiltrados.length}`}
                >
                  {(fatia) => (
                <ul className="space-y-2">
                  {fatia.map((item) => {
                    const msgIncompleta = mensagemInternacaoIncompleta(
                      item.statusLaudoSus,
                      item.statusFichaHospitalar
                    )
                    return (
                    <li
                      key={item.atendimentoId}
                      className={cn(
                        'bg-card border rounded-xl p-4 hover:shadow-sm transition-all',
                        msgIncompleta
                          ? 'border-amber-400/70 bg-amber-50/30 dark:bg-amber-950/10'
                          : 'border-border hover:border-emerald-300/60'
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground text-base">
                              {item.nomePaciente}
                            </p>
                            <BadgeStatus status="INTERNADO" />
                            {msgIncompleta ? (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                                {msgIncompleta}
                              </span>
                            ) : null}
                            {item.corTriagem ? (
                              <BadgeManchester cor={item.corTriagem} size="sm" />
                            ) : null}
                            <span
                              className={cn(
                                'text-xs font-semibold px-2 py-0.5 rounded-full',
                                item.fichaSusPreenchida
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                              )}
                            >
                              {item.fichaSusPreenchida ? 'Ficha SUS OK' : 'Sem ficha SUS'}
                            </span>
                            {item.statusFichaHospitalar ? (
                              <BadgeFicha
                                label={getStatusFichaHospitalar(item.statusFichaHospitalar).label}
                                cls={getStatusFichaHospitalar(item.statusFichaHospitalar).cls}
                              />
                            ) : (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                                Sem ficha hospitalar
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-mono text-muted-foreground mt-0.5">
                            Atendimento {item.numeroAtendimento}
                          </p>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              <span className="font-medium text-foreground">Leito:</span>{' '}
                              {item.leito || '— (definir na admissão)'}
                            </span>
                            <span>
                              <span className="font-medium text-foreground">Clínica/CID:</span>{' '}
                              {item.tipoClinica || '—'}
                              {item.cidInternacao ? ` · ${item.cidInternacao}` : ''}
                            </span>
                            <span>
                              <span className="font-medium text-foreground">Internado em:</span>{' '}
                              {format(new Date(item.internadoEm), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {item.obstetrico ? (
                            <Link
                              href={`/evolucoes/${item.atendimentoId}?aba=INTERNACAO_OBSTETRICA`}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-pink-400/50 text-pink-700 dark:text-pink-300 text-sm font-semibold hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors"
                              aria-label={`Ficha obstétrica de ${item.nomePaciente}`}
                            >
                              <ClipboardList className="h-4 w-4" aria-hidden />
                              Ficha obstétrica
                            </Link>
                          ) : (
                            <Link
                              href={`/internamento/ficha-alta/${item.atendimentoId}`}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-violet-400/50 text-violet-700 dark:text-violet-300 text-sm font-semibold hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                              aria-label={`Ficha hospitalar de ${item.nomePaciente}`}
                            >
                              <ClipboardList className="h-4 w-4" aria-hidden />
                              Ficha hospitalar
                            </Link>
                          )}
                          <Link
                            href={`/internamento/ficha/${item.atendimentoId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
                            aria-label={`Ficha SUS de ${item.nomePaciente}`}
                          >
                            <FileText className="h-4 w-4" aria-hidden />
                            Ficha SUS
                          </Link>
                        </div>
                      </div>
                    </li>
                    )
                  })}
                </ul>
                  )}
                </EnvoltorioListaPaginada>
              )}
            </>
          )}
        </div>
      )}

      {/* Conteúdo da Aba: Ficha Internação e Alta Hospitalar */}
      {abaAtiva === 'fichaHospitalar' && (
        <div className="space-y-4">
          {carregando && !ultimaAtualizacao ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
              <p className="text-sm">Carregando fichas hospitalares…</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Folha de Internação e Alta Hospitalar — dados de admissão e atendimento inicial.
                Evoluções, enfermagem e alta são registradas em Prontuário Enfermagem.
              </p>

              {fichasHospitalaresFiltradas.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm space-y-2">
                  <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground/40" aria-hidden />
                  <p>
                    {termo
                      ? 'Nenhum paciente encontrado para a busca.'
                      : 'Não há pacientes aguardando ou internados no momento.'}
                  </p>
                </div>
              ) : (
                <EnvoltorioListaPaginada
                  items={fichasHospitalaresFiltradas}
                  chaveReset={`ficha-${termo}-${fichasHospitalaresFiltradas.length}`}
                >
                  {(fatia) => (
                <ul className="space-y-2">
                  {fatia.map((item) => {
                    const ficha = getStatusFichaHospitalar(item.statusFicha)
                    const aguardando = item.statusAtendimento === 'AGUARDANDO_INTERNACAO'
                    const msgIncompleta = mensagemInternacaoIncompleta(
                      item.statusLaudoSus,
                      item.statusFicha
                    )

                    return (
                      <li
                        key={item.atendimentoId}
                        className={cn(
                          'bg-card border rounded-xl p-4 hover:shadow-sm transition-all',
                          msgIncompleta
                            ? 'border-amber-400/60 bg-amber-50/20 dark:bg-amber-950/10'
                            : 'border-border hover:border-violet-300/60'
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-foreground text-base">
                                {item.nomePaciente}
                              </p>
                              <BadgeStatus status={item.statusAtendimento} />
                              {msgIncompleta ? (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                                  {msgIncompleta}
                                </span>
                              ) : null}
                              {item.corTriagem ? (
                                <BadgeManchester cor={item.corTriagem} size="sm" />
                              ) : null}
                              <BadgeFicha label={ficha.label} cls={ficha.cls} />
                              <span
                                className={cn(
                                  'text-xs font-medium px-2 py-0.5 rounded border whitespace-nowrap',
                                  item.fichaSusPreenchida
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300'
                                )}
                              >
                                {item.fichaSusPreenchida ? 'Ficha SUS OK' : 'Ficha SUS pendente'}
                              </span>
                            </div>
                            <p className="text-sm font-mono text-muted-foreground mt-0.5">
                              Atendimento {item.numeroAtendimento}
                            </p>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>
                                <span className="font-medium text-foreground">Leito:</span>{' '}
                                {item.leito || '— (definir na admissão)'}
                              </span>
                              {item.atualizadoEm ? (
                                <span>
                                  <span className="font-medium text-foreground">Ficha atualizada:</span>{' '}
                                  {format(new Date(item.atualizadoEm), 'dd/MM/yyyy HH:mm')}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {aguardando ? (
                              <Link
                                href={`/internamento/admitir/${item.atendimentoId}`}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                                aria-label={`Receber e preencher ficha de ${item.nomePaciente}`}
                              >
                                <UserPlus className="h-4 w-4" aria-hidden />
                                Receber paciente
                              </Link>
                            ) : null}
                            {item.obstetrico ? (
                              <Link
                                href={`/evolucoes/${item.atendimentoId}?aba=INTERNACAO_OBSTETRICA`}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-pink-400/50 text-pink-700 dark:text-pink-300 text-sm font-semibold hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors"
                                aria-label={`Ficha obstétrica de ${item.nomePaciente}`}
                              >
                                <ClipboardList className="h-4 w-4" aria-hidden />
                                Ficha obstétrica
                              </Link>
                            ) : (
                              <Link
                                href={`/internamento/ficha-alta/${item.atendimentoId}`}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-violet-400/50 text-violet-700 dark:text-violet-300 text-sm font-semibold hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                                aria-label={`Ficha hospitalar de ${item.nomePaciente}`}
                              >
                                <ClipboardList className="h-4 w-4" aria-hidden />
                                {item.statusFicha ? 'Editar ficha' : 'Preencher ficha'}
                              </Link>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                  )}
                </EnvoltorioListaPaginada>
              )}
            </>
          )}
        </div>
      )}

      {/* Conteúdo da Aba 3: Internamento Hospitalar */}
      {abaAtiva === 'hospitalar' && (
        <div className="space-y-4">
          {/* Formulário de Filtros Baseado no FiltroInternamentoLista */}
          <form
            onSubmit={handlePesquisarHospitalar}
            className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4 shadow-sm"
            aria-label="Pesquisar internados hospitalares"
          >
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Pesquisar Internação Hospitalar
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label
                  htmlFor="filtro-nome"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Nome do paciente
                </label>
                <input
                  id="filtro-nome"
                  type="search"
                  value={filtroNome}
                  onChange={(e) => setFiltroNome(e.target.value)}
                  placeholder="Ex.: Maria Silva"
                  className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label
                  htmlFor="filtro-prontuario"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Prontuário / atendimento
                </label>
                <input
                  id="filtro-prontuario"
                  type="search"
                  value={filtroProntuario}
                  onChange={(e) => setFiltroProntuario(e.target.value)}
                  placeholder="Ex.: 20240315-0001"
                  className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label
                  htmlFor="filtro-data-inicio"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Internação — de
                </label>
                <input
                  id="filtro-data-inicio"
                  type="date"
                  value={filtroDataInicio}
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                  className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label
                  htmlFor="filtro-data-fim"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Internação — até
                </label>
                <input
                  id="filtro-data-fim"
                  type="date"
                  value={filtroDataFim}
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                  className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
              <button
                type="submit"
                disabled={carregandoHospitalar}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {carregandoHospitalar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Pesquisar
              </button>
              <button
                type="button"
                onClick={handleLimparHospitalar}
                disabled={carregandoHospitalar}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Limpar
              </button>
              <button
                type="button"
                onClick={carregarHospitalar}
                disabled={carregandoHospitalar}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors ml-auto"
                aria-label="Atualizar internamento hospitalar"
              >
                <RefreshCw
                  className={cn('h-4 w-4', carregandoHospitalar && 'animate-spin')}
                  aria-hidden
                />
              </button>
            </div>
          </form>

          {/* Listagem de Pacientes Internados Hospitalares */}
          {carregandoHospitalar && hospitalar.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
              <p className="text-sm">Carregando internações hospitalares…</p>
            </div>
          ) : (
            <>
              {hospitalar.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm space-y-2">
                  <BedDouble className="h-8 w-8 mx-auto text-muted-foreground/40" aria-hidden />
                  <p>Nenhum paciente internado encontrado.</p>
                </div>
              ) : (
                <EnvoltorioListaPaginada
                  items={hospitalar}
                  chaveReset={`hospitalar-${filtroNome}-${hospitalar.length}`}
                >
                  {(fatia) => (
                <ul className="space-y-2">
                  {fatia.map((item) => {
                    const laudo = getStatusLaudo(item.statusLaudo)
                    const ccih = getStatusCcih(item.statusCcih)
                    const multi = getStatusMultidisciplinar(item.statusMulti)

                    return (
                      <li
                        key={item.atendimentoId}
                        className="bg-card border border-border rounded-xl p-4 hover:border-blue-300/60 hover:shadow-sm transition-all"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-foreground text-base">
                                {item.nomePaciente}
                              </p>
                              <BadgeStatus status="INTERNADO" />
                              {item.corTriagem ? (
                                <BadgeManchester cor={item.corTriagem} size="sm" />
                              ) : null}
                            </div>
                            <p className="text-sm font-mono text-muted-foreground mt-0.5">
                              Atendimento {item.numeroAtendimento}
                            </p>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>
                                <span className="font-medium text-foreground">Leito:</span>{' '}
                                {item.leito || '— (cadastro de leitos)'}
                              </span>
                              <span>
                                <span className="font-medium text-foreground">Setor:</span>{' '}
                                {item.setor || '—'}
                              </span>
                              <span>
                                <span className="font-medium text-foreground">Clínica/CID:</span>{' '}
                                {item.tipoClinica || '—'}
                                {item.cidInternacao ? ` · ${item.cidInternacao}` : ''}
                              </span>
                              <span>
                                <span className="font-medium text-foreground">Internado em:</span>{' '}
                                {format(new Date(item.internadoEm), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </div>

                            {/* Badges de Fichas (Laudo SUS, CCIH, Multidisciplinar) */}
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                              <BadgeFicha label={laudo.label} cls={laudo.cls} />
                              <BadgeFicha label={ccih.label} cls={ccih.cls} />
                              <BadgeFicha label={multi.label} cls={multi.cls} />
                            </div>
                          </div>

                          {/* Ações da Internação Hospitalar (Sem link de prontuário, com doses pendentes e fichas) */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {podeVerMedicacaoPendente && item.dosesPendentes > 0 ? (
                              <Link
                                href={`/evolucoes/${item.atendimentoId}?aba=INSTRUCOES_ENFERMAGEM`}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-400/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 text-sm font-semibold hover:opacity-90"
                                aria-label={`${item.dosesPendentes} dose(s) pendente(s) — aplicar medicação`}
                              >
                                <Pill className="h-4 w-4" aria-hidden />
                                {item.dosesPendentes} pend.
                              </Link>
                            ) : null}

                            <Link
                              href={`/recepcao/imprimir/${item.numeroAtendimento}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50 transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5" aria-hidden />
                              Recepção
                            </Link>

                            <Link
                              href={`/internamento/ficha/${item.atendimentoId}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-primary/40 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
                              aria-label="Cadastrar/Editar Ficha SUS"
                            >
                              <ClipboardList className="h-3.5 w-3.5" aria-hidden />
                              Ficha SUS
                            </Link>

                            <Link
                              href={`/internamento/imprimir/${item.atendimentoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50 transition-colors"
                              aria-label="Imprimir Ficha SUS"
                            >
                              <Printer className="h-3.5 w-3.5" aria-hidden />
                              Imprimir
                            </Link>

                            {item.encaminhamentoId && (
                              <Link
                                href={`/atendimento/encaminhamento/imprimir/${item.encaminhamentoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50 transition-colors"
                                aria-label="Imprimir solicitação médica"
                              >
                                Solicitação
                              </Link>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                  )}
                </EnvoltorioListaPaginada>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
