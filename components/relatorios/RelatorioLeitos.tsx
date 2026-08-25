'use client'

import { useEffect, useState, useTransition } from 'react'
import { Search, FileText, Download, Loader2, BedDouble, CheckCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { downloadCsv } from '@/lib/export-csv'
import { ModalRelatorioPdf } from '@/components/relatorios/ModalRelatorioPdf'

interface LeitoItem {
  id: string
  codigo: string
  ala: string
  quarto: string
  tipo: string
  clinica: string
  status: string
  ativo: boolean
}

export function RelatorioLeitos() {
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [leitos, setLeitos] = useState<LeitoItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function carregarDados() {
    setCarregando(true)
    try {
      const url = `/api/relatorios/cadastros?tipo=leitos&busca=${encodeURIComponent(
        busca
      )}&status=${encodeURIComponent(status)}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.sucesso) {
        setLeitos(data.dados || [])
      } else {
        toast.error(data.erro || 'Erro ao carregar dados.')
      }
    } catch {
      toast.error('Erro de conexão.')
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
  }, [busca, status])

  async function baixarPdf() {
    setGerandoPdf(true)
    try {
      const url = `/api/relatorios/cadastros?tipo=leitos&format=pdf&busca=${encodeURIComponent(
        busca
      )}&status=${encodeURIComponent(status)}`
      const res = await fetch(url)
      if (!res.ok) {
        toast.error('Falha ao gerar PDF.')
        return
      }
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      setPdfUrl(blobUrl)
      toast.success('Relatório em PDF gerado.')
    } catch {
      toast.error('Erro ao gerar PDF.')
    } finally {
      setGerandoPdf(false)
    }
  }

  function exportarCsv() {
    const headers = ['Código', 'Ala', 'Quarto', 'Tipo', 'Clínica', 'Status Ocupação', 'Ativo']
    const rows = leitos.map((l) => [
      l.codigo,
      l.ala,
      l.quarto,
      l.tipo,
      l.clinica,
      l.status,
      l.ativo ? 'Sim' : 'Não',
    ])
    downloadCsv(`relatorio-leitos-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
    toast.success('Arquivo CSV baixado.')
  }

  const totalLeitos = leitos.length
  const disponiveis = leitos.filter((l) => l.status === 'DISPONIVEL').length
  const ocupados = leitos.filter((l) => l.status === 'OCUPADO').length
  const interditados = leitos.filter((l) => l.status === 'INTERDITADO').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <BedDouble className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total de Leitos</p>
            <p className="text-2xl font-bold text-foreground">{totalLeitos}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Disponíveis</p>
            <p className="text-2xl font-bold text-emerald-600">{disponiveis}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-lg">
            <BedDouble className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Ocupados</p>
            <p className="text-2xl font-bold text-amber-600">{ocupados}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-lg">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Interditados</p>
            <p className="text-2xl font-bold text-rose-600">{interditados}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por código, ala, quarto..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-input rounded-lg text-sm bg-background"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-input rounded-lg px-3 py-2 text-sm bg-background"
            >
              <option value="">Todos os status</option>
              <option value="DISPONIVEL">Disponível</option>
              <option value="OCUPADO">Ocupado</option>
              <option value="INTERDITADO">Interditado</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportarCsv}
              disabled={carregando || leitos.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-muted disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={baixarPdf}
              disabled={gerandoPdf || carregando}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {gerandoPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Gerar PDF
            </button>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Ala</th>
                <th className="px-4 py-3">Quarto</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Clínica</th>
                <th className="px-4 py-3">Status Ocupação</th>
                <th className="px-4 py-3">Ativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {carregando || isPending ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Carregando leitos...
                  </td>
                </tr>
              ) : leitos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum leito encontrado.
                  </td>
                </tr>
              ) : (
                leitos.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold font-mono text-foreground">{l.codigo}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{l.ala}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.quarto}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs font-semibold">{l.tipo}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.clinica}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          l.status === 'DISPONIVEL'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : l.status === 'OCUPADO'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{l.ativo ? 'Sim' : 'Não'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pdfUrl ? (
        <ModalRelatorioPdf
          aberto={Boolean(pdfUrl)}
          onClose={() => {
            URL.revokeObjectURL(pdfUrl)
            setPdfUrl(null)
          }}
          pdfUrl={pdfUrl}
          nomeArquivo={`relatorio-leitos-${new Date().toISOString().slice(0, 10)}.pdf`}
          titulo="Relatório — Leitos Hospitalares"
        />
      ) : null}
    </div>
  )
}
