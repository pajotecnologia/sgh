'use client'

import { useEffect, useState, useTransition } from 'react'
import { Search, FileText, Download, Loader2, Stethoscope, UserCheck, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { downloadCsv } from '@/lib/export-csv'
import { ModalRelatorioPdf } from '@/components/relatorios/ModalRelatorioPdf'

interface ProfissionalItem {
  id: string
  nome: string
  email: string
  role: string
  crm?: string | null
  coren?: string | null
  ativo: boolean
  createdAt: string
}

export function RelatorioProfissionais() {
  const [busca, setBusca] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [profissionais, setProfissionais] = useState<ProfissionalItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function carregarDados() {
    setCarregando(true)
    try {
      const url = `/api/relatorios/cadastros?tipo=profissionais&busca=${encodeURIComponent(
        busca
      )}&role=${encodeURIComponent(role)}&status=${encodeURIComponent(status)}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.sucesso) {
        setProfissionais(data.dados || [])
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
  }, [busca, role, status])

  async function baixarPdf() {
    setGerandoPdf(true)
    try {
      const url = `/api/relatorios/cadastros?tipo=profissionais&format=pdf&busca=${encodeURIComponent(
        busca
      )}&role=${encodeURIComponent(role)}&status=${encodeURIComponent(status)}`
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
    const headers = ['Nome', 'E-mail', 'Perfil', 'CRM/COREN', 'Status', 'Cadastrado Em']
    const rows = profissionais.map((p) => [
      p.nome,
      p.email,
      p.role,
      p.crm ? `CRM ${p.crm}` : p.coren ? `COREN ${p.coren}` : '—',
      p.ativo ? 'Ativo' : 'Inativo',
      new Date(p.createdAt).toLocaleDateString('pt-BR'),
    ])
    downloadCsv(`relatorio-profissionais-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
    toast.success('Arquivo CSV baixado.')
  }

  const total = profissionais.length
  const totalMedicos = profissionais.filter((p) => p.role === 'MEDICO' || p.role === 'DIRETOR_CLINICO').length
  const totalEnfermagem = profissionais.filter(
    (p) => p.role === 'ENFERMEIRO' || p.role === 'TECNICO_ENFERMAGEM'
  ).length

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total de Usuários</p>
            <p className="text-2xl font-bold text-foreground">{total}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-lg">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Médicos / Diretores</p>
            <p className="text-2xl font-bold text-foreground">{totalMedicos}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Enfermagem</p>
            <p className="text-2xl font-bold text-foreground">{totalEnfermagem}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome, email, CRM..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-input rounded-lg text-sm bg-background"
              />
            </div>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border border-input rounded-lg px-3 py-2 text-sm bg-background"
            >
              <option value="">Todos os perfis</option>
              <option value="MEDICO">Médico</option>
              <option value="ENFERMEIRO">Enfermeiro</option>
              <option value="TECNICO_ENFERMAGEM">Téc. Enfermagem</option>
              <option value="DIRETOR_CLINICO">Diretor Clínico</option>
              <option value="RECEPCIONISTA">Recepcionista</option>
              <option value="FARMACEUTICO">Farmacêutico</option>
              <option value="ADMIN">Administrador</option>
            </select>

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
              disabled={carregando || profissionais.length === 0}
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

        {/* Tabela */}
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3">Profissional</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Perfil / Role</th>
                <th className="px-4 py-3">Registro Consel.</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {carregando || isPending ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Carregando profissionais...
                  </td>
                </tr>
              ) : profissionais.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum profissional encontrado.
                  </td>
                </tr>
              ) : (
                profissionais.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{p.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                    <td className="px-4 py-3 font-medium text-primary text-xs">{p.role}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {p.crm ? `CRM ${p.crm}` : p.coren ? `COREN ${p.coren}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.ativo
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
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
          nomeArquivo={`relatorio-profissionais-${new Date().toISOString().slice(0, 10)}.pdf`}
          titulo="Relatório — Profissionais e Usuários"
        />
      ) : null}
    </div>
  )
}
