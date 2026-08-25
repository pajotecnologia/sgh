'use client'

import { useEffect, useState, useTransition } from 'react'
import { Search, FileText, Download, Loader2, Users, CreditCard, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { downloadCsv } from '@/lib/export-csv'
import { ModalRelatorioPdf } from '@/components/relatorios/ModalRelatorioPdf'

interface PacienteItem {
  id: string
  nomeCompleto: string
  dataNascimento: string
  sexoBiologico: string
  convenio: string
  numeroCarteirinha: string
  createdAt: string
}

export function RelatorioPacientes() {
  const [busca, setBusca] = useState('')
  const [pacientes, setPacientes] = useState<PacienteItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function carregarDados() {
    setCarregando(true)
    try {
      const url = `/api/relatorios/cadastros?tipo=pacientes&busca=${encodeURIComponent(busca)}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.sucesso) {
        setPacientes(data.dados || [])
      } else {
        toast.error(data.erro || 'Erro ao carregar dados.')
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
  }, [busca])

  async function baixarPdf() {
    setGerandoPdf(true)
    try {
      const url = `/api/relatorios/cadastros?tipo=pacientes&format=pdf&busca=${encodeURIComponent(busca)}`
      const res = await fetch(url)
      if (!res.ok) {
        toast.error('Falha ao gerar PDF de pacientes.')
        return
      }
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      setPdfUrl(blobUrl)
      toast.success('Relatório em PDF gerado com sucesso.')
    } catch {
      toast.error('Erro de rede ao solicitar PDF.')
    } finally {
      setGerandoPdf(false)
    }
  }

  function exportarCsv() {
    const headers = ['Nome Completo', 'Data Nascimento', 'Sexo', 'Convênio', 'Carteirinha', 'Cadastrado Em']
    const rows = pacientes.map((p) => [
      p.nomeCompleto,
      new Date(p.dataNascimento).toLocaleDateString('pt-BR'),
      p.sexoBiologico,
      p.convenio,
      p.numeroCarteirinha,
      new Date(p.createdAt).toLocaleDateString('pt-BR'),
    ])
    downloadCsv(`relatorio-pacientes-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
    toast.success('Arquivo CSV baixado.')
  }

  const totalPacientes = pacientes.length
  const totalConvenio = pacientes.filter((p) => p.convenio && p.convenio.toLowerCase() !== 'particular').length
  const totalParticular = totalPacientes - totalConvenio

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total de Pacientes</p>
            <p className="text-2xl font-bold text-foreground">{totalPacientes}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-lg">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Com Convênio</p>
            <p className="text-2xl font-bold text-foreground">{totalConvenio}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Atend. Particular</p>
            <p className="text-2xl font-bold text-foreground">{totalParticular}</p>
          </div>
        </div>
      </div>

      {/* Painel de Filtro e Exportação */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome ou convênio..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-input rounded-lg text-sm bg-background"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportarCsv}
              disabled={carregando || pacientes.length === 0}
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

        {/* Tabela de Resultados */}
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3">Paciente</th>
                <th className="px-4 py-3">Data Nasc.</th>
                <th className="px-4 py-3">Sexo</th>
                <th className="px-4 py-3">Convênio</th>
                <th className="px-4 py-3">Carteirinha</th>
                <th className="px-4 py-3">Data Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {carregando || isPending ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Carregando pacientes...
                  </td>
                </tr>
              ) : pacientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum paciente encontrado.
                  </td>
                </tr>
              ) : (
                pacientes.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{p.nomeCompleto}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(p.dataNascimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.sexoBiologico}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.convenio && p.convenio.toLowerCase() !== 'particular'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {p.convenio || 'Particular'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.numeroCarteirinha}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString('pt-BR')}
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
          nomeArquivo={`relatorio-pacientes-${new Date().toISOString().slice(0, 10)}.pdf`}
          titulo="Relatório — Cadastros de Pacientes"
        />
      ) : null}
    </div>
  )
}
