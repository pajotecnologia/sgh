'use client'

import { useEffect, useState, useTransition } from 'react'
import { Search, FileText, Download, Loader2, ClipboardList, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { downloadCsv } from '@/lib/export-csv'
import { ModalRelatorioPdf } from '@/components/relatorios/ModalRelatorioPdf'

interface PrescricaoPadraoItem {
  id: string
  nome: string
  descricao: string
  nomeColunaEsquerda: string
  nomeColunaDireita: string
  qtdItens: number
  ativo: boolean
}

export function RelatorioPrescricoesPadrao() {
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [prescricoes, setPrescricoes] = useState<PrescricaoPadraoItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function carregarDados() {
    setCarregando(true)
    try {
      const url = `/api/relatorios/cadastros?tipo=prescricoes-padrao&busca=${encodeURIComponent(
        busca
      )}&status=${encodeURIComponent(status)}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.sucesso) {
        setPrescricoes(data.dados || [])
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
      const url = `/api/relatorios/cadastros?tipo=prescricoes-padrao&format=pdf&busca=${encodeURIComponent(
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
    const headers = ['Nome da Prescrição Padrão', 'Coluna Esquerda', 'Coluna Direita', 'Qtd Itens', 'Status']
    const rows = prescricoes.map((p) => [
      p.nome,
      p.nomeColunaEsquerda,
      p.nomeColunaDireita,
      p.qtdItens,
      p.ativo ? 'Ativa' : 'Inativa',
    ])
    downloadCsv(`relatorio-prescricoes-padrao-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
    toast.success('Arquivo CSV baixado.')
  }

  const total = prescricoes.length
  const totalItens = prescricoes.reduce((acc, cur) => acc + cur.qtdItens, 0)
  const totalAtivas = prescricoes.filter((p) => p.ativo).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total de Modelos</p>
            <p className="text-2xl font-bold text-foreground">{total}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-lg">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total de Itens Cadastrados</p>
            <p className="text-2xl font-bold text-foreground">{totalItens}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Modelos Ativos</p>
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
                placeholder="Buscar por nome do modelo..."
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
              disabled={carregando || prescricoes.length === 0}
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
                <th className="px-4 py-3">Modelo de Prescrição</th>
                <th className="px-4 py-3">Coluna Esquerda</th>
                <th className="px-4 py-3">Coluna Direita</th>
                <th className="px-4 py-3">Qtd Itens</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {carregando || isPending ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Carregando prescrições padrão...
                  </td>
                </tr>
              ) : prescricoes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum modelo encontrado.
                  </td>
                </tr>
              ) : (
                prescricoes.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{p.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.nomeColunaEsquerda}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.nomeColunaDireita}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{p.qtdItens}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.ativo
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {p.ativo ? 'Ativa' : 'Inativa'}
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
          nomeArquivo={`relatorio-prescricoes-padrao-${new Date().toISOString().slice(0, 10)}.pdf`}
          titulo="Relatório — Prescrições Médicas Padrão"
        />
      ) : null}
    </div>
  )
}
