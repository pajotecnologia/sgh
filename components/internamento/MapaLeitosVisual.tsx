'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  BedDouble,
  Activity,
  Users,
  Search,
  Filter,
  RefreshCw,
  ArrowRightLeft,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Stethoscope,
  X,
  ExternalLink,
  ChevronRight,
  Shield,
  Building2,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  MapaLeitosResultado,
  LeitoMapaItem,
  PacienteLeitoMapa,
} from '@/lib/mapa-leitos'
import type { TipoLeitoHospitalar, StatusLeitoHospitalar, CorTriagem } from '@/types'
import { BadgeManchester } from '@/components/triagem/BadgeManchester'
import { cn } from '@/lib/utils'

const CORES_TIPO_LEITO: Record<TipoLeitoHospitalar, { label: string; bg: string; text: string; border: string }> = {
  UTI: {
    label: 'UTI',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-800',
  },
  ENFERMARIA: {
    label: 'Enfermaria',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-800',
  },
  ISOLAMENTO: {
    label: 'Isolamento',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800',
  },
  OBSERVACAO: {
    label: 'Observação',
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-800',
  },
}

export function MapaLeitosVisual() {
  const [dados, setDados] = useState<MapaLeitosResultado | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [filtroClinica, setFiltroClinica] = useState<string>('TODAS')
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS')
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS')
  const [buscaTexto, setBuscaTexto] = useState<string>('')

  // Modais de ação
  const [leitoTransferencia, setLeitoTransferencia] = useState<LeitoMapaItem | null>(null)
  const [leitoDestinoSelecionado, setLeitoDestinoSelecionado] = useState<string>('')
  const [motivoTransferencia, setMotivoTransferencia] = useState<string>('')
  const [transferindo, setTransferindo] = useState(false)

  const [leitoStatusModal, setLeitoStatusModal] = useState<LeitoMapaItem | null>(null)
  const [novoStatus, setNovoStatus] = useState<'DISPONIVEL' | 'INTERDITADO'>('INTERDITADO')
  const [motivoStatus, setMotivoStatus] = useState<string>('')
  const [salvandoStatus, setSalvandoStatus] = useState(false)

  const [leitoDetalhes, setLeitoDetalhes] = useState<LeitoMapaItem | null>(null)

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true)
      const res = await fetch('/api/internamento/mapa-leitos')
      const json = await res.json()
      if (json.sucesso && json.dados) {
        setDados(json.dados)
      } else {
        toast.error(json.erro || 'Falha ao carregar mapa de leitos.')
      }
    } catch {
      toast.error('Erro de conexão ao carregar mapa de leitos.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Lista plana de leitos disponíveis para transferência
  const leitosDisponiveis = useMemo(() => {
    if (!dados) return []
    const lista: LeitoMapaItem[] = []
    dados.clinicas.forEach((c) => {
      c.alas.forEach((a) => {
        a.leitos.forEach((l) => {
          if (l.status === 'DISPONIVEL' && l.ativo && l.id !== leitoTransferencia?.id) {
            lista.push(l)
          }
        })
      })
    })
    dados.alasGerais.forEach((a) => {
      a.leitos.forEach((l) => {
        if (l.status === 'DISPONIVEL' && l.ativo && l.id !== leitoTransferencia?.id) {
          lista.push(l)
        }
      })
    })
    return lista
  }, [dados, leitoTransferencia])

  // Filtragem de leitos na visualização
  const clinicasFiltradas = useMemo(() => {
    if (!dados) return []
    const termo = buscaTexto.toLowerCase().trim()

    return dados.clinicas
      .filter((c) => filtroClinica === 'TODAS' || c.id === filtroClinica)
      .map((c) => {
        const alasFiltradas = c.alas
          .map((a) => {
            const leitosFiltrados = a.leitos.filter((l) => {
              if (filtroTipo !== 'TODOS' && l.tipo !== filtroTipo) return false
              if (filtroStatus !== 'TODOS' && l.status !== filtroStatus) return false
              if (termo) {
                const matchCodigo = l.codigo.toLowerCase().includes(termo)
                const matchQuarto = l.quarto?.toLowerCase().includes(termo)
                const matchAla = l.ala.toLowerCase().includes(termo)
                const matchPaciente = l.pacienteAtual?.nome.toLowerCase().includes(termo)
                const matchCid = l.pacienteAtual?.diagnosticoPrincipal?.toLowerCase().includes(termo)
                if (!matchCodigo && !matchQuarto && !matchAla && !matchPaciente && !matchCid) {
                  return false
                }
              }
              return true
            })
            return { ...a, leitos: leitosFiltrados }
          })
          .filter((a) => a.leitos.length > 0)

        return { ...c, alas: alasFiltradas }
      })
      .filter((c) => c.alas.length > 0)
  }, [dados, filtroClinica, filtroTipo, filtroStatus, buscaTexto])

  // Executar Transferência
  const handleTransferir = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leitoTransferencia?.pacienteAtual || !leitoDestinoSelecionado) {
      toast.error('Selecione o leito de destino.')
      return
    }

    try {
      setTransferindo(true)
      const res = await fetch('/api/internamento/mapa-leitos/transferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          atendimentoId: leitoTransferencia.pacienteAtual.atendimentoId,
          leitoDestinoId: leitoDestinoSelecionado,
          motivo: motivoTransferencia || undefined,
        }),
      })

      const json = await res.json()
      if (json.sucesso) {
        toast.success(json.mensagem || 'Transferência realizada com sucesso!')
        setLeitoTransferencia(null)
        setLeitoDestinoSelecionado('')
        setMotivoTransferencia('')
        carregarDados()
      } else {
        toast.error(json.erro || 'Falha ao transferir leito.')
      }
    } catch {
      toast.error('Erro ao comunicar com o servidor.')
    } finally {
      setTransferindo(false)
    }
  }

  // Executar Mudança de Status
  const handleMudarStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leitoStatusModal) return

    try {
      setSalvandoStatus(true)
      const res = await fetch('/api/internamento/mapa-leitos/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leitoId: leitoStatusModal.id,
          status: novoStatus,
          motivo: motivoStatus || undefined,
        }),
      })

      const json = await res.json()
      if (json.sucesso) {
        toast.success(json.mensagem || 'Status do leito atualizado!')
        setLeitoStatusModal(null)
        setMotivoStatus('')
        carregarDados()
      } else {
        toast.error(json.erro || 'Falha ao atualizar status.')
      }
    } catch {
      toast.error('Erro ao comunicar com o servidor.')
    } finally {
      setSalvandoStatus(false)
    }
  }

  if (carregando && !dados) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Carregando mapa hospitalar de leitos...</p>
      </div>
    )
  }

  const metricas = dados?.metricas

  return (
    <div className="space-y-6">
      {/* Cards de Métricas e Ocupação */}
      {metricas && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Taxa de Ocupação */}
          <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Ocupação Geral</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {metricas.taxaOcupacao}%
              </span>
              <span className="text-xs text-muted-foreground">
                ({metricas.leitosOcupados}/{metricas.totalAtivos} ativos)
              </span>
            </div>
            <div className="mt-3 w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500 rounded-full',
                  metricas.taxaOcupacao > 85
                    ? 'bg-rose-500'
                    : metricas.taxaOcupacao > 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(100, metricas.taxaOcupacao)}%` }}
              />
            </div>
          </div>

          {/* Leitos Livres */}
          <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Leitos Livres</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {metricas.leitosLivres}
              </span>
              <span className="text-xs text-muted-foreground">prontos p/ internação</span>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Disponibilidade imediata</p>
          </div>

          {/* Leitos Ocupados */}
          <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Leitos Ocupados</span>
              <Users className="h-4 w-4" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {metricas.leitosOcupados}
              </span>
              <span className="text-xs text-muted-foreground">pacientes internados</span>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Assistência em andamento</p>
          </div>

          {/* Leitos UTI */}
          <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Leitos UTI</span>
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                {metricas.distribuicaoTipo.UTI.ocupados}/{metricas.distribuicaoTipo.UTI.total}
              </span>
              <span className="text-xs text-muted-foreground">
                ({metricas.distribuicaoTipo.UTI.livres} livres)
              </span>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Alta complexidade</p>
          </div>

          {/* Interditados */}
          <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Interditados</span>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {metricas.leitosInterditados}
              </span>
              <span className="text-xs text-muted-foreground">manutenção/bloqueio</span>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Fora de operação</p>
          </div>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
            {/* Busca Textual */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                placeholder="Buscar por paciente, código do leito, quarto ou CID..."
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {buscaTexto && (
                <button
                  type="button"
                  onClick={() => setBuscaTexto('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filtro Clínica */}
            {dados && dados.clinicas.length > 0 && (
              <select
                value={filtroClinica}
                onChange={(e) => setFiltroClinica(e.target.value)}
                aria-label="Filtrar por Clínica"
                className="text-xs sm:text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="TODAS">Todas as Clínicas</option>
                {dados.clinicas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.ocupados}/{c.totalLeitos})
                  </option>
                ))}
              </select>
            )}

            {/* Filtro Tipo de Leito */}
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              aria-label="Filtrar por Tipo de Leito"
              className="text-xs sm:text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="ENFERMARIA">Enfermaria</option>
              <option value="UTI">UTI</option>
              <option value="ISOLAMENTO">Isolamento</option>
              <option value="OBSERVACAO">Observação</option>
            </select>

            {/* Filtro Status */}
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              aria-label="Filtrar por Status"
              className="text-xs sm:text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="DISPONIVEL">Apenas Livres</option>
              <option value="OCUPADO">Apenas Ocupados</option>
              <option value="INTERDITADO">Apenas Interditados</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={carregarDados}
              disabled={carregando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-border hover:bg-muted/60 text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', carregando && 'animate-spin')} />
              Atualizar
            </button>
            <Link
              href="/internamento/admissoes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Users className="h-3.5 w-3.5" />
              Admissões Pendentes
            </Link>
          </div>
        </div>

        {/* Legenda visual dos status */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/60 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Legenda:</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <span>Disponível</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600 dark:bg-blue-400 shadow-sm" />
            <span>Ocupado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm" />
            <span>Interditado / Bloqueado</span>
          </div>
        </div>
      </div>

      {/* Grid de Clínicas e Alas */}
      {clinicasFiltradas.length === 0 ? (
        <div className="bg-card border border-border/80 rounded-xl p-12 text-center space-y-3">
          <BedDouble className="h-10 w-10 text-muted-foreground/60 mx-auto" />
          <h3 className="text-base font-semibold text-foreground">Nenhum leito encontrado</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Não foram encontrados leitos correspondentes aos filtros selecionados. Tente ajustar os parâmetros de busca.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {clinicasFiltradas.map((clinica) => (
            <section key={clinica.id} className="space-y-4">
              {/* Cabeçalho da Clínica */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">{clinica.nome}</h2>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm">
                  <span className="px-2.5 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                    {clinica.totalLeitos} leitos no total
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                    {clinica.livres} livres
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold">
                    {clinica.ocupados} ocupados
                  </span>
                  <span className="font-semibold text-foreground">
                    Taxa: {clinica.taxaOcupacao}%
                  </span>
                </div>
              </div>

              {/* Alas da Clínica */}
              <div className="space-y-6">
                {clinica.alas.map((ala) => (
                  <div key={ala.nome} className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      <span>{ala.nome}</span>
                      <span className="text-[11px] font-normal lowercase">({ala.leitos.length} leitos)</span>
                    </div>

                    {/* Cards de Leitos da Ala */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                      {ala.leitos.map((leito) => {
                        const tipoInfo = CORES_TIPO_LEITO[leito.tipo] ?? CORES_TIPO_LEITO.ENFERMARIA
                        const ocupado = leito.status === 'OCUPADO'
                        const livre = leito.status === 'DISPONIVEL'
                        const interditado = leito.status === 'INTERDITADO'
                        const p = leito.pacienteAtual

                        return (
                          <div
                            key={leito.id}
                            className={cn(
                              'relative rounded-xl border p-3.5 transition-all flex flex-col justify-between shadow-sm hover:shadow-md',
                              livre && 'bg-emerald-50/40 border-emerald-300 dark:bg-emerald-950/15 dark:border-emerald-800/60',
                              ocupado && 'bg-card border-blue-300/80 dark:border-blue-900/60 ring-1 ring-blue-500/10',
                              interditado && 'bg-muted/40 border-amber-300/70 dark:border-amber-900/40 opacity-80'
                            )}
                          >
                            {/* Topo do Card: Código, Quarto e Tipo */}
                            <div>
                              <div className="flex items-start justify-between gap-1.5 mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={cn(
                                      'h-2.5 w-2.5 rounded-full shrink-0',
                                      livre && 'bg-emerald-500 animate-pulse',
                                      ocupado && 'bg-blue-600 dark:bg-blue-400',
                                      interditado && 'bg-amber-500'
                                    )}
                                  />
                                  <span className="font-bold text-sm sm:text-base tracking-tight text-foreground">
                                    {leito.codigo}
                                  </span>
                                  {leito.quarto && (
                                    <span className="text-xs text-muted-foreground">
                                      (Q. {leito.quarto})
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={cn(
                                    'text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase',
                                    tipoInfo.bg,
                                    tipoInfo.text,
                                    tipoInfo.border
                                  )}
                                >
                                  {tipoInfo.label}
                                </span>
                              </div>

                              {/* Conteúdo Central Conforme Status */}
                              {ocupado && p ? (
                                <div className="space-y-2 py-1">
                                  <div className="flex items-start justify-between gap-1">
                                    <span className="font-semibold text-xs sm:text-sm text-foreground line-clamp-1">
                                      {p.nome}
                                    </span>
                                    {p.corTriagem && (
                                      <BadgeManchester cor={p.corTriagem} tamanho="sm" />
                                    )}
                                  </div>

                                  <div className="space-y-1 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5 text-[11px]">
                                      <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                                      <span>Internado há <strong>{p.tempoInternacaoFormatado}</strong></span>
                                    </div>
                                    {p.diagnosticoPrincipal && (
                                      <p className="text-[11px] line-clamp-1 font-medium text-foreground/80" title={p.diagnosticoPrincipal}>
                                        🩺 {p.diagnosticoPrincipal}
                                      </p>
                                    )}
                                    {p.medicoResponsavel && (
                                      <p className="text-[11px] line-clamp-1 text-muted-foreground">
                                        Dr(a). {p.medicoResponsavel}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ) : livre ? (
                                <div className="py-3 text-center space-y-1">
                                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
                                    Leito Disponível
                                  </span>
                                  <span className="text-[11px] text-muted-foreground block">
                                    Pronto para receber admissão
                                  </span>
                                </div>
                              ) : (
                                <div className="py-3 text-center space-y-1">
                                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block">
                                    Leito Interditado
                                  </span>
                                  {leito.observacoes && (
                                    <span className="text-[11px] text-muted-foreground line-clamp-1 block" title={leito.observacoes}>
                                      {leito.observacoes}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Rodapé de Ações do Card */}
                            <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between gap-1.5">
                              {ocupado && p ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setLeitoDetalhes(leito)}
                                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                                  >
                                    <Info className="h-3 w-3" />
                                    Detalhes
                                  </button>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLeitoTransferencia(leito)
                                        setLeitoDestinoSelecionado('')
                                        setMotivoTransferencia('')
                                      }}
                                      title="Transferir paciente para outro leito"
                                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      <ArrowRightLeft className="h-3.5 w-3.5" />
                                    </button>
                                    <Link
                                      href={`/prontuario/${p.atendimentoId}`}
                                      title="Abrir Prontuário"
                                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </Link>
                                  </div>
                                </>
                              ) : livre ? (
                                <>
                                  <Link
                                    href="/internamento/admissoes"
                                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                                  >
                                    Admitir
                                    <ChevronRight className="h-3 w-3" />
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLeitoStatusModal(leito)
                                      setNovoStatus('INTERDITADO')
                                      setMotivoStatus('')
                                    }}
                                    title="Interditar leito"
                                    className="text-[11px] text-muted-foreground hover:text-amber-600 transition-colors"
                                  >
                                    Interditar
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLeitoStatusModal(leito)
                                    setNovoStatus('DISPONIVEL')
                                    setMotivoStatus('')
                                  }}
                                  className="w-full text-center text-xs font-semibold text-primary hover:underline py-0.5"
                                >
                                  Liberar / Desinterditar
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal: Transferência de Leito */}
      {leitoTransferencia && leitoTransferencia.pacienteAtual && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <ArrowRightLeft className="h-5 w-5" />
                <span>Transferência de Leito</span>
              </div>
              <button
                type="button"
                onClick={() => setLeitoTransferencia(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
              <p><strong>Paciente:</strong> {leitoTransferencia.pacienteAtual.nome}</p>
              <p><strong>Leito Atual:</strong> {leitoTransferencia.ala} — {leitoTransferencia.codigo} ({leitoTransferencia.clinicaNome})</p>
              <p><strong>Tempo Internado:</strong> {leitoTransferencia.pacienteAtual.tempoInternacaoFormatado}</p>
            </div>

            <form onSubmit={handleTransferir} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Selecione o Leito de Destino <span className="text-destructive">*</span>
                </label>
                <select
                  value={leitoDestinoSelecionado}
                  onChange={(e) => setLeitoDestinoSelecionado(e.target.value)}
                  required
                  className="w-full text-sm rounded-lg border border-border bg-background p-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecione um leito disponível...</option>
                  {leitosDisponiveis.map((ld) => (
                    <option key={ld.id} value={ld.id}>
                      {ld.clinicaNome} — Ala {ld.ala} | Leito {ld.codigo} ({ld.tipo})
                    </option>
                  ))}
                </select>
                {leitosDisponiveis.length === 0 && (
                  <p className="text-[11px] text-destructive mt-1">
                    Nenhum outro leito disponível no momento no hospital.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Motivo da Transferência
                </label>
                <textarea
                  rows={2}
                  value={motivoTransferencia}
                  onChange={(e) => setMotivoTransferencia(e.target.value)}
                  placeholder="Ex.: Mudança para leito de isolamento, melhor acomodação, proximidade ao posto..."
                  className="w-full text-xs rounded-lg border border-border bg-background p-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setLeitoTransferencia(null)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={transferindo || !leitoDestinoSelecionado}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {transferindo && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Confirmar Transferência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Interdição / Liberação */}
      {leitoStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                <span>
                  {novoStatus === 'INTERDITADO' ? 'Interditar Leito' : 'Liberar Leito'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLeitoStatusModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Leito: <strong>{leitoStatusModal.ala} — {leitoStatusModal.codigo}</strong> ({leitoStatusModal.clinicaNome})
            </p>

            <form onSubmit={handleMudarStatus} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Motivo / Observação {novoStatus === 'INTERDITADO' && <span className="text-destructive">*</span>}
                </label>
                <textarea
                  rows={2}
                  value={motivoStatus}
                  onChange={(e) => setMotivoStatus(e.target.value)}
                  required={novoStatus === 'INTERDITADO'}
                  placeholder={
                    novoStatus === 'INTERDITADO'
                      ? 'Ex.: Higienização terminal, manutenção na rede de oxigênio...'
                      : 'Ex.: Higienização concluída, liberado para internação.'
                  }
                  className="w-full text-xs rounded-lg border border-border bg-background p-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setLeitoStatusModal(null)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoStatus}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {salvandoStatus && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalhes Rápidos do Paciente no Leito */}
      {leitoDetalhes && leitoDetalhes.pacienteAtual && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-foreground font-bold text-base">
                <BedDouble className="h-5 w-5 text-primary" />
                <span>Leito {leitoDetalhes.codigo} — {leitoDetalhes.ala}</span>
              </div>
              <button
                type="button"
                onClick={() => setLeitoDetalhes(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground">
                    {leitoDetalhes.pacienteAtual.nome}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Atendimento nº {leitoDetalhes.pacienteAtual.numeroAtendimento}
                  </p>
                </div>
                {leitoDetalhes.pacienteAtual.corTriagem && (
                  <BadgeManchester cor={leitoDetalhes.pacienteAtual.corTriagem} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-lg">
                <div>
                  <span className="text-muted-foreground">Idade / Sexo:</span>
                  <p className="font-semibold">{leitoDetalhes.pacienteAtual.idadeAnos ? `${leitoDetalhes.pacienteAtual.idadeAnos} anos` : 'N/I'} • {leitoDetalhes.pacienteAtual.sexo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo Sanguíneo:</span>
                  <p className="font-semibold">{leitoDetalhes.pacienteAtual.tipoSanguineo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tempo Internado:</span>
                  <p className="font-semibold text-primary">{leitoDetalhes.pacienteAtual.tempoInternacaoFormatado}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Médico Responsável:</span>
                  <p className="font-semibold">{leitoDetalhes.pacienteAtual.medicoResponsavel || 'Não atribuído'}</p>
                </div>
              </div>

              {leitoDetalhes.pacienteAtual.diagnosticoPrincipal && (
                <div className="text-xs bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/50">
                  <span className="font-semibold text-blue-900 dark:text-blue-300">Diagnóstico Principal:</span>
                  <p className="text-blue-800 dark:text-blue-200 mt-0.5">{leitoDetalhes.pacienteAtual.diagnosticoPrincipal}</p>
                </div>
              )}

              {leitoDetalhes.pacienteAtual.queixaPrincipal && (
                <div className="text-xs bg-muted/40 p-2.5 rounded-lg">
                  <span className="font-semibold text-muted-foreground">Queixa da Triagem:</span>
                  <p className="text-foreground mt-0.5">{leitoDetalhes.pacienteAtual.queixaPrincipal}</p>
                </div>
              )}
            </div>

            {/* Links Rápidos de Acesso */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border">
              <Link
                href={`/prontuario/${leitoDetalhes.pacienteAtual.atendimentoId}`}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <FileText className="h-3 w-3" />
                Prontuário
              </Link>
              <Link
                href={`/internamento/ficha/${leitoDetalhes.pacienteAtual.atendimentoId}`}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
              >
                <Stethoscope className="h-3 w-3" />
                Ficha Internação
              </Link>
              <Link
                href={`/prontuario/paciente/${leitoDetalhes.pacienteAtual.pacienteId}`}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors col-span-2 sm:col-span-1"
              >
                <Clock className="h-3 w-3" />
                Histórico Longitudinal
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
