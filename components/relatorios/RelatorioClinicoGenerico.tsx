'use client'

import { useEffect, useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  FileText,
  Download,
  Loader2,
  Calendar,
  ExternalLink,
  Filter,
  RefreshCw,
  LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { downloadCsv } from '@/lib/export-csv'
import { ModalRelatorioPdf } from '@/components/relatorios/ModalRelatorioPdf'

export interface MetricaCardConfig {
  label: string
  valorKey: string
  icon: LucideIcon
  cor?: 'primary' | 'emerald' | 'amber' | 'blue' | 'rose' | 'violet'
}

export interface ColunaConfig {
  key: string
  header: string
  render?: (row: any) => React.ReactNode
}

export interface RelatorioClinicoGenericoProps {
  tipo: string
  titulo: string
  descricao: string
  icon: LucideIcon
  metricasCards: MetricaCardConfig[]
  colunas: ColunaConfig[]
  csvHeaders: string[]
  csvRowMapper: (row: any) => (string | number | null | undefined)[]
  filtroTurnoDisponivel?: boolean
  opcoesStatus?: { valor: string; label: string }[]
  linkModo?: 'prontuario' | 'evolucoes' | 'ficha-hospitalar' | 'ficha-sus' | 'ccih' | 'laudo-solicitacao'
}

export function RelatorioClinicoGenerico({
  tipo,
  titulo,
  descricao,
  icon: IconePrincipal,
  metricasCards,
  colunas,
  csvHeaders,
  csvRowMapper,
  filtroTurnoDisponivel,
  opcoesStatus,
  linkModo = 'evolucoes',
}: RelatorioClinicoGenericoProps) {
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [turno, setTurno] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [dados, setDados] = useState<any[]>([])
  const [metricas, setMetricas] = useState<Record<string, any>>({})
  const [carregando, setCarregando] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function carregarDados() {
    setCarregando(true)
    try {
      const params = new URLSearchParams({
        tipo,
        format: 'json',
        busca,
        status,
        turno,
        dataInicio,
        dataFim,
      })
      const res = await fetch(`/api/relatorios/clinicos?${params.toString()}`)
      const json = await res.json()
      if (json.sucesso) {
        setDados(json.dados || [])
        setMetricas(json.metricas || {})
      } else {
        toast.error(json.erro || 'Erro ao carregar dados do relatório.')
      }
    } catch {
      toast.error('Erro de conexão ao buscar relatório.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        carregarDados()
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [busca, status, turno, dataInicio, dataFim])

  async function baixarPdf() {
    setGerandoPdf(true)
    try {
      const params = new URLSearchParams({
        tipo,
        format: 'pdf',
        busca,
        status,
        turno,
        dataInicio,
        dataFim,
      })
      const res = await fetch(`/api/relatorios/clinicos?${params.toString()}`)
      if (!res.ok) {
        toast.error('Falha ao gerar documento PDF.')
        return
      }
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      setPdfUrl(blobUrl)
      toast.success('Relatório em PDF gerado com sucesso.')
    } catch {
      toast.error('Erro ao gerar PDF.')
    } finally {
      setGerandoPdf(false)
    }
  }

  function exportarCsv() {
    if (dados.length === 0) return
    const rows = dados.map(csvRowMapper)
    downloadCsv(`relatorio-${tipo}-${new Date().toISOString().slice(0, 10)}.csv`, csvHeaders, rows)
    toast.success('Arquivo CSV baixado com sucesso.')
  }

  const corStyles = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    rose: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    violet: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  }

  return (
    <div className="space-y-6">
      {/* Header do Relatório */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20 shadow-xs">
            <IconePrincipal className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">{titulo}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{descricao}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={carregarDados}
            disabled={carregando}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-xs font-semibold hover:bg-muted transition-colors disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            type="button"
            onClick={exportarCsv}
            disabled={carregando || dados.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-xs font-semibold hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={baixarPdf}
            disabled={gerandoPdf || carregando}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 shadow-xs transition-colors disabled:opacity-50"
          >
            {gerandoPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Gerar PDF
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      {metricasCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricasCards.map((card) => {
            const IconeCard = card.icon
            const estilo = corStyles[card.cor || 'primary']
            const valor = metricas[card.valorKey] ?? 0
            return (
              <div
                key={card.label}
                className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs"
              >
                <div className={`p-3 rounded-xl border ${estilo}`}>
                  <IconeCard className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium truncate">{card.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{valor}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {/* Filtros e Busca */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por paciente, atendimento, médico, leito..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> De:
            </span>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="border border-input rounded-lg px-2.5 py-1.5 text-xs bg-background"
            />
            <span className="text-xs text-muted-foreground font-medium">Até:</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="border border-input rounded-lg px-2.5 py-1.5 text-xs bg-background"
            />
          </div>

          {opcoesStatus && opcoesStatus.length > 0 ? (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-input rounded-lg px-3 py-2 text-xs bg-background"
            >
              <option value="">Todos os status</option>
              {opcoesStatus.map((opt) => (
                <option key={opt.valor} value={opt.valor}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : null}

          {filtroTurnoDisponivel ? (
            <select
              value={turno}
              onChange={(e) => setTurno(e.target.value)}
              className="border border-input rounded-lg px-3 py-2 text-xs bg-background"
            >
              <option value="">Todos os turnos</option>
              <option value="DIA">☀️ Diurno (Dia)</option>
              <option value="NOITE">🌙 Noturno (Noite)</option>
            </select>
          ) : null}
        </div>

        {/* Tabela de Dados */}
        <div className="border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-[11px] font-semibold uppercase text-muted-foreground border-b border-border">
              <tr>
                {colunas.map((col) => (
                  <th key={col.key} className="px-4 py-3 whitespace-nowrap">
                    {col.header}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {carregando || isPending ? (
                <tr>
                  <td colSpan={colunas.length + 1} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Carregando registros clínicos...
                  </td>
                </tr>
              ) : dados.length === 0 ? (
                <tr>
                  <td colSpan={colunas.length + 1} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum registro clínico encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                dados.map((row, idx) => {
                  const targetAtendId = row.atendimentoId || row.id
                  const urlLink =
                    linkModo === 'prontuario'
                      ? `/prontuario/${targetAtendId}`
                      : linkModo === 'ficha-hospitalar'
                      ? `/internamento/ficha-alta/imprimir/${targetAtendId}`
                      : linkModo === 'ficha-sus'
                      ? `/internamento/imprimir/${targetAtendId}`
                      : linkModo === 'ccih'
                      ? `/internamento/ccih/imprimir/${targetAtendId}`
                      : linkModo === 'laudo-solicitacao'
                      ? `/internamento/laudo-solicitacao/imprimir/${targetAtendId}`
                      : `/evolucoes/${targetAtendId}`

                  return (
                    <tr key={row.id || idx} className="hover:bg-muted/30 transition-colors">
                      {colunas.map((col) => (
                        <td key={col.key} className="px-4 py-3">
                          {col.render ? (
                            col.render(row)
                          ) : (
                            <span className="text-foreground text-xs">{row[col.key] ?? '—'}</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {targetAtendId ? (
                          <Link
                            href={urlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 text-xs font-semibold transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver Ficha
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Preview do PDF */}
      {pdfUrl ? (
        <ModalRelatorioPdf
          aberto={Boolean(pdfUrl)}
          onClose={() => {
            URL.revokeObjectURL(pdfUrl)
            setPdfUrl(null)
          }}
          pdfUrl={pdfUrl}
          nomeArquivo={`relatorio-${tipo}-${new Date().toISOString().slice(0, 10)}.pdf`}
          titulo={titulo}
        />
      ) : null}
    </div>
  )
}
