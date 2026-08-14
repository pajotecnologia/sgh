'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Truck,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  FileDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, mascaraCnpj, mascaraTelefone, validarEmail, validarCnpj } from '@/lib/utils'

export type Fornecedor = {
  id: string
  razaoSocial: string
  nomeFantasia: string | null
  cnpj: string
  inscricaoEstadual: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  cidade: string | null
  uf: string | null
  ativo: boolean
  createdAt: string
  _count?: { entradasNf?: number }
}

export function GestaoFornecedoresFarmacia() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [apenasAtivos, setApenasAtivos] = useState(true)

  // Modal
  const [modalAberto, setModalAberto] = useState(false)
  const [edicaoId, setEdicaoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Form
  const [razaoSocial, setRazaoSocial] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [inscricaoEstadual, setInscricaoEstadual] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')

  const carregarFornecedores = useCallback(async () => {
    setCarregando(true)
    try {
      const query = new URLSearchParams()
      if (busca) query.set('q', busca)
      query.set('apenasAtivos', apenasAtivos ? 'true' : 'false')

      const res = await fetch(`/api/farmacia/fornecedores?${query.toString()}`)
      const json = await res.json()
      if (json.sucesso && Array.isArray(json.dados)) {
        setFornecedores(json.dados)
      } else {
        toast.error(json.erro ?? 'Erro ao carregar fornecedores')
      }
    } catch {
      toast.error('Erro de conexão ao carregar fornecedores')
    } finally {
      setCarregando(false)
    }
  }, [busca, apenasAtivos])

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarFornecedores()
    }, 300)
    return () => clearTimeout(timer)
  }, [busca, apenasAtivos, carregarFornecedores])

  const handleNovo = () => {
    setEdicaoId(null)
    setRazaoSocial('')
    setNomeFantasia('')
    setCnpj('')
    setInscricaoEstadual('')
    setTelefone('')
    setEmail('')
    setEndereco('')
    setCidade('')
    setUf('')
    setModalAberto(true)
  }

  const handleEditar = (f: Fornecedor) => {
    setEdicaoId(f.id)
    setRazaoSocial(f.razaoSocial)
    setNomeFantasia(f.nomeFantasia ?? '')
    setCnpj(f.cnpj)
    setInscricaoEstadual(f.inscricaoEstadual ?? '')
    setTelefone(f.telefone ?? '')
    setEmail(f.email ?? '')
    setEndereco(f.endereco ?? '')
    setCidade(f.cidade ?? '')
    setUf(f.uf ?? '')
    setModalAberto(true)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!razaoSocial.trim() || !cnpj.trim()) {
      toast.error('Razão Social e CNPJ são campos obrigatórios!')
      return
    }

    setSalvando(true)
    try {
      const url = edicaoId ? `/api/farmacia/fornecedores/${edicaoId}` : '/api/farmacia/fornecedores'
      const method = edicaoId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razaoSocial,
          nomeFantasia: nomeFantasia.trim() || null,
          cnpj,
          inscricaoEstadual: inscricaoEstadual.trim() || null,
          telefone: telefone.trim() || null,
          email: email.trim() || null,
          endereco: endereco.trim() || null,
          cidade: cidade.trim() || null,
          uf: uf.trim() || null,
        }),
      })

      const json = await res.json()
      if (json.sucesso) {
        toast.success(edicaoId ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor cadastrado com sucesso!')
        setModalAberto(false)
        carregarFornecedores()
      } else {
        toast.error(json.erro ?? 'Erro ao salvar fornecedor')
      }
    } catch {
      toast.error('Erro de conexão ao salvar fornecedor')
    } finally {
      setSalvando(false)
    }
  }

  const handleInativar = async (id: string, razao: string) => {
    if (!confirm(`Tem certeza que deseja inativar o fornecedor "${razao}"?`)) return

    try {
      const res = await fetch(`/api/farmacia/fornecedores/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.sucesso) {
        toast.success('Fornecedor inativado com sucesso')
        carregarFornecedores()
      } else {
        toast.error(json.erro ?? 'Erro ao inativar fornecedor')
      }
    } catch {
      toast.error('Erro de conexão ao inativar fornecedor')
    }
  }

  const formatarCnpj = (v: string) => {
    const limpo = v.replace(/\D/g, '')
    if (limpo.length === 14) {
      return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return v
  }

  return (
    <div className="space-y-4">
      {/* Topo com Estatísticas e Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Cadastro de Fornecedores
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie os fornecedores, distribuidores e laboratórios parceiros da farmácia.
          </p>
        </div>

        <button
          type="button"
          onClick={handleNovo}
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 py-2.5 text-xs font-semibold hover:brightness-95 shadow-sm transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          Novo Fornecedor
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por Razão Social, Nome Fantasia ou CNPJ..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          <input
            type="checkbox"
            checked={apenasAtivos}
            onChange={(e) => setApenasAtivos(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-700 text-primary"
          />
          Apenas Fornecedores Ativos
        </label>
      </div>

      {/* Lista de Fornecedores */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Fornecedores Cadastrados
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {carregando ? 'Carregando...' : `${fornecedores.length} encontrados`}
          </p>
        </div>

        {carregando ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Carregando fornecedores...
          </div>
        ) : fornecedores.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <Building2 className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhum fornecedor encontrado</p>
            <p className="text-xs mt-0.5">Clique em &quot;Novo Fornecedor&quot; para realizar o cadastro.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {fornecedores.map((f) => (
              <div
                key={f.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {f.razaoSocial}
                    </p>
                    {f.nomeFantasia ? (
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {f.nomeFantasia}
                      </span>
                    ) : null}

                    {f.ativo ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-950/60 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800">
                        <CheckCircle2 className="h-3 w-3" /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        <XCircle className="h-3 w-3" /> Inativo
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <span>
                      <strong>CNPJ:</strong> {formatarCnpj(f.cnpj)}
                    </span>
                    {f.inscricaoEstadual ? <span><strong>I.E.:</strong> {f.inscricaoEstadual}</span> : null}
                    {f.telefone ? (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" /> {f.telefone}
                      </span>
                    ) : null}
                    {f.email ? (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" /> {f.email}
                      </span>
                    ) : null}
                    {(f.cidade || f.uf) ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" /> {[f.cidade, f.uf].filter(Boolean).join('/')}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEditar(f)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Editar
                  </button>

                  {f.ativo ? (
                    <button
                      type="button"
                      onClick={() => handleInativar(f.id, f.razaoSocial)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Inativar
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Modal de Cadastro / Edição */}
      {modalAberto ? (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                {edicaoId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h3>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder="Ex.: Distribuidora de Medicamentos Ltda"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    placeholder="Ex.: Pharma Distribuição"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    required
                    value={cnpj}
                    onChange={(e) => setCnpj(mascaraCnpj(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className={cn(
                      "mt-1 w-full rounded-xl border bg-background text-foreground px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30",
                      cnpj && !validarCnpj(cnpj) ? "border-amber-400 dark:border-amber-600" : "border-slate-200 dark:border-slate-800"
                    )}
                  />
                  {cnpj && !validarCnpj(cnpj) ? (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-semibold">
                      CNPJ completo deve ter 14 dígitos.
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Inscrição Estadual (I.E.)
                  </label>
                  <input
                    type="text"
                    value={inscricaoEstadual}
                    onChange={(e) => setInscricaoEstadual(e.target.value)}
                    placeholder="Isento ou número"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                    placeholder="(00) 90000-0000"
                    maxLength={15}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    E-mail Comercial / Faturamento
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@fornecedor.com.br"
                    className={cn(
                      "mt-1 w-full rounded-xl border bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30",
                      email && !validarEmail(email) ? "border-red-400 dark:border-red-600" : "border-slate-200 dark:border-slate-800"
                    )}
                  />
                  {email && !validarEmail(email) ? (
                    <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 font-semibold">
                      Informe um e-mail em formato válido (ex.: contato@empresa.com.br).
                    </p>
                  ) : null}
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, Número, Bairro"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="São Paulo"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    UF (Estado)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={uf}
                    onChange={(e) => setUf(e.target.value.toUpperCase())}
                    placeholder="SP"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-4 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-5 py-2 text-xs font-semibold hover:brightness-95 disabled:opacity-50"
                >
                  {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {edicaoId ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
