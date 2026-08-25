'use client'

import { useEffect, useState, useTransition } from 'react'
import { Search, FileText, Download, Loader2, Building2, BedDouble, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { downloadCsv } from '@/lib/export-csv'
import { ModalRelatorioPdf } from '@/components/relatorios/ModalRelatorioPdf'

interface ClinicaItem {
  id: string
  nome: string
  descricao: string
  ativo: boolean
  qtdLeitos: number
  createdAt: string
}

export function RelatorioClinicas() {
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [clinicas, setClinicas] = useState<ClinicaItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function carregarDados() {
    setCarregando(true)
    try {
      const url = `/api/relatorios/cadastros?tipo=clinicas&busca=${encodeURIComponent(
        busca
      )}&status=${encodeURIComponent(status)}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.sucesso) {
        setClinicas(data.dados || [])
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
      const url = `/api/relatorios/cadastros?tipo=clinicas&format=pdf&busca=${encodeURIComponent(
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
    const headers = ['Nome da Clínica', 'Descrição', 'Status', 'Leitos Vinculados', 'Cadastrada Em']
    const rows = clinicas.map((c) => [
      c.nome,
      c.descricao,
      c.ativo ? 'Ativa' : 'Inativa',
      c.qtdLeitos,
      new Date(c.createdAt).toLocaleDateString('pt-BR'),
    ])
    downloadCsv(`relatorio-clinicas-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
    toast.success('Arquivo CSV baixado.')
  }

  const totalClinicas = clinicas.length
  const totalLeitos = clinicas.reduce((acc, cur) => acc + cur.qtdLeitos, 0)
  const totalAtivas = clinicas.filter((c) => c.ativo).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total de Clínicas</p>
            <p className="text-2xl font-bold text-foreground">{totalClinicas}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-lg">
            <BedDouble className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Leitos Vinculados</p>
            <p className="text-2xl font-bold text-foreground">{totalLeitos}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Clínicas Ativas</p>
            <p className="text-2xl font-bold text-foreground">{totalAtivas}</p>
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
                placeholder="Buscar por nome da clínica..."
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
              <option value="ativo">Somente Ativas</option>
              <option value="inativo">Somente Inativas</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportarCsv}
              disabled={carregando || clinicas.length === 0}
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
                <th className="px-4 py-3">Nome da Clínica</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Leitos Vinculados</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {carregando || isPending ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Carregando clínicas...
                  </td>
                </tr>
              ) : clinicas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma clínica encontrada.
                  </td>
                </tr>
              ) : (
                clinicas.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{c.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{c.descricao}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{c.qtdLeitos}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          c.ativo
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {c.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </td>
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
          nomeArquivo={`relatorio-clinicas-${new Date().toISOString().slice(0, 10)}.pdf`}
          titulo="Relatório — Clínicas e Especialidades"
        />
      ) : null}
    </div>
  )
}
