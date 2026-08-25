'use client'

import { useEffect, useState, useTransition } from 'react'
import { Search, FileText, Download, Loader2, Truck, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { downloadCsv } from '@/lib/export-csv'
import { ModalRelatorioPdf } from '@/components/relatorios/ModalRelatorioPdf'

interface FornecedorItem {
  id: string
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  telefone: string
  email: string
  cidadeUf: string
  ativo: boolean
}

export function RelatorioFornecedores() {
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [fornecedores, setFornecedores] = useState<FornecedorItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function carregarDados() {
    setCarregando(true)
    try {
      const url = `/api/relatorios/cadastros?tipo=fornecedores&busca=${encodeURIComponent(
        busca
      )}&status=${encodeURIComponent(status)}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.sucesso) {
        setFornecedores(data.dados || [])
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
      const url = `/api/relatorios/cadastros?tipo=fornecedores&format=pdf&busca=${encodeURIComponent(
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
    const headers = ['Razão Social', 'Nome Fantasia', 'CNPJ', 'Telefone', 'E-mail', 'Cidade/UF', 'Status']
    const rows = fornecedores.map((f) => [
      f.razaoSocial,
      f.nomeFantasia,
      f.cnpj,
      f.telefone,
      f.email,
      f.cidadeUf,
      f.ativo ? 'Ativo' : 'Inativo',
    ])
    downloadCsv(`relatorio-fornecedores-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
    toast.success('Arquivo CSV baixado.')
  }

  const total = fornecedores.length
  const totalAtivos = fornecedores.filter((f) => f.ativo).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total de Fornecedores</p>
            <p className="text-2xl font-bold text-foreground">{total}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Fornecedores Ativos</p>
            <p className="text-2xl font-bold text-foreground">{totalAtivos}</p>
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
                placeholder="Buscar por razão social ou CNPJ..."
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
              <option value="ativo">Somente Ativos</option>
              <option value="inativo">Somente Inativos</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportarCsv}
              disabled={carregando || fornecedores.length === 0}
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
                <th className="px-4 py-3">Razão Social / Fantasia</th>
                <th className="px-4 py-3">CNPJ</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Cidade / UF</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {carregando || isPending ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Carregando fornecedores...
                  </td>
                </tr>
              ) : fornecedores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum fornecedor encontrado.
                  </td>
                </tr>
              ) : (
                fornecedores.map((f) => (
                  <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{f.razaoSocial}</p>
                      {f.nomeFantasia && f.nomeFantasia !== '—' && (
                        <p className="text-xs text-muted-foreground">{f.nomeFantasia}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{f.cnpj}</td>
                    <td className="px-4 py-3 text-muted-foreground">{f.telefone}</td>
                    <td className="px-4 py-3 text-muted-foreground">{f.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{f.cidadeUf}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          f.ativo
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {f.ativo ? 'Ativo' : 'Inativo'}
                      </span>
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
          nomeArquivo={`relatorio-fornecedores-${new Date().toISOString().slice(0, 10)}.pdf`}
          titulo="Relatório — Fornecedores da Farmácia"
        />
      ) : null}
    </div>
  )
}
