'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { toast } from 'sonner'
import { Sparkles, Loader2, Search, Plus, Tags, Pencil, Trash2, X, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type MedicamentoOption = { id: string; nome: string; principioAtivo: string }

type SinonimoRow = {
  id: string
  medicamentoId: string
  sinonimo: string
  sinonimoNorm: string
  ativo: boolean
  updatedAt: string
  medicamento: { id: string; nome: string; principioAtivo: string }
}

const schemaCriar = z.object({
  medicamentoId: z.string().uuid(),
  sinonimo: z.string().min(2).max(120),
})

const schemaEditar = z.object({
  sinonimo: z.string().min(2).max(120),
  medicamentoId: z.string().uuid(),
})

export function GestaoSinonimosFarmacia({ medicamentos }: { medicamentos: MedicamentoOption[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qInicial = (searchParams.get('q') ?? '').trim()
  const medIdInicial = (searchParams.get('medicamentoId') ?? '').trim()

  const [q, setQ] = useState(qInicial)
  const [medicamentoId, setMedicamentoId] = useState(medIdInicial)
  const [sinonimo, setSinonimo] = useState('')
  const [itens, setItens] = useState<SinonimoRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [gerandoAuto, setGerandoAuto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Estado para Edição
  const [sinonimoEmEdicao, setSinonimoEmEdicao] = useState<SinonimoRow | null>(null)
  const [editSinonimo, setEditSinonimo] = useState('')
  const [editMedicamentoId, setEditMedicamentoId] = useState('')
  const [editAtivo, setEditAtivo] = useState(true)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)

  // Estado para Exclusão
  const [sinonimoParaExcluir, setSinonimoParaExcluir] = useState<SinonimoRow | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const medicamentoSelecionado = useMemo(
    () => medicamentos.find((m) => m.id === medicamentoId) ?? null,
    [medicamentoId, medicamentos]
  )

  const handleBuscar = async () => {
    setErro(null)
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (medicamentoId) params.set('medicamentoId', medicamentoId)
      const res = await fetch(`/api/farmacia/sinonimos?${params.toString()}`, { method: 'GET' })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        setErro(json?.erro ?? 'Falha ao buscar sinônimos.')
        setItens([])
        return
      }
      setItens((json.dados ?? []) as SinonimoRow[])
      router.replace(`/cadastros/sinonimos?${params.toString()}`)
    } catch {
      setErro('Falha ao buscar sinônimos.')
      setItens([])
    } finally {
      setLoading(false)
    }
  }

  // Carrega busca inicial ao abrir a tela
  useEffect(() => {
    handleBuscar()
  }, [])

  const handleCriar = async () => {
    setErro(null)
    const validacao = schemaCriar.safeParse({ medicamentoId, sinonimo })
    if (!validacao.success) {
      setErro('Selecione o medicamento e informe um sinônimo (mín. 2 caracteres).')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/farmacia/sinonimos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ medicamentoId, sinonimo }),
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        setErro(json?.erro ?? 'Falha ao criar sinônimo.')
        return
      }
      toast.success('Sinônimo cadastrado com sucesso!')
      setSinonimo('')
      await handleBuscar()
    } catch {
      setErro('Falha ao criar sinônimo.')
    } finally {
      setLoading(false)
    }
  }

  const handleAbrirEdicao = (row: SinonimoRow) => {
    setSinonimoEmEdicao(row)
    setEditSinonimo(row.sinonimo)
    setEditMedicamentoId(row.medicamentoId)
    setEditAtivo(row.ativo)
    setErroEdicao(null)
  }

  const handleSalvarEdicao = async () => {
    if (!sinonimoEmEdicao) return
    setErroEdicao(null)

    const validacao = schemaEditar.safeParse({
      sinonimo: editSinonimo,
      medicamentoId: editMedicamentoId,
    })

    if (!validacao.success) {
      setErroEdicao('Informe o nome do sinônimo (mín. 2 caracteres) e selecione o medicamento.')
      return
    }

    setSalvandoEdicao(true)
    try {
      const res = await fetch('/api/farmacia/sinonimos', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: sinonimoEmEdicao.id,
          sinonimo: editSinonimo.trim(),
          medicamentoId: editMedicamentoId,
          ativo: editAtivo,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        setErroEdicao(json?.erro ?? 'Falha ao atualizar sinônimo.')
        return
      }

      toast.success('Sinônimo corrigido e atualizado com sucesso!')
      const atualizado = json.dados as SinonimoRow

      setItens((prev) =>
        (prev ?? []).map((item) => (item.id === atualizado.id ? atualizado : item))
      )
      setSinonimoEmEdicao(null)
    } catch {
      setErroEdicao('Falha ao atualizar sinônimo.')
    } finally {
      setSalvandoEdicao(false)
    }
  }

  const handleExcluirSinonimo = async () => {
    if (!sinonimoParaExcluir) return
    setExcluindo(true)
    try {
      const res = await fetch(`/api/farmacia/sinonimos?id=${encodeURIComponent(sinonimoParaExcluir.id)}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(json?.erro ?? 'Falha ao excluir sinônimo.')
        return
      }

      toast.success('Sinônimo excluído com sucesso!')
      setItens((prev) => (prev ?? []).filter((i) => i.id !== sinonimoParaExcluir.id))
      setSinonimoParaExcluir(null)
    } catch {
      toast.error('Erro de conexão ao excluir sinônimo.')
    } finally {
      setExcluindo(false)
    }
  }

  const handleGerarAutomaticos = async () => {
    setGerandoAuto(true)
    try {
      const res = await fetch('/api/farmacia/sinonimos/gerar-automaticos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(json?.erro || 'Falha ao gerar sinônimos automáticos.')
        return
      }

      toast.success(json.mensagem || `${json.dados.sinonimosCriados} sinônimos oficiais gerados com sucesso!`)
      await handleBuscar()
    } catch {
      toast.error('Erro de conexão ao gerar sinônimos.')
    } finally {
      setGerandoAuto(false)
    }
  }

  const handleAlternarAtivo = async (id: string, ativoAtual: boolean) => {
    setErro(null)
    setLoading(true)
    try {
      const res = await fetch('/api/farmacia/sinonimos', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, ativo: !ativoAtual }),
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        setErro(json?.erro ?? 'Falha ao atualizar sinônimo.')
        return
      }
      toast.success(`Sinônimo ${!ativoAtual ? 'ativado' : 'desativado'} com sucesso!`)
      setItens((prev) =>
        (prev ?? []).map((r) => (r.id === id ? { ...r, ativo: !ativoAtual, updatedAt: new Date().toISOString() } : r))
      )
    } catch {
      setErro('Falha ao atualizar sinônimo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Painel de Filtros e Geração em Massa */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Medicamento (catálogo)
            </label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              value={medicamentoId}
              onChange={(e) => setMedicamentoId(e.target.value)}
              aria-label="Selecionar medicamento do catálogo"
            >
              <option value="">Todos os medicamentos…</option>
              {medicamentos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} — {m.principioAtivo}
                </option>
              ))}
            </select>
            {medicamentoSelecionado ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Selecionado: <span className="font-semibold text-foreground">{medicamentoSelecionado.nome}</span> (
                {medicamentoSelecionado.principioAtivo})
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Buscar por termo ou marca
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ex.: Novalgina, Rocefin, AAS…"
              aria-label="Buscar sinônimos"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold',
                'bg-primary text-white hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs'
              )}
              onClick={handleBuscar}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              <span>Pesquisar</span>
            </button>

            {(q || medicamentoId) && (
              <button
                type="button"
                onClick={() => {
                  setQ('')
                  setMedicamentoId('')
                }}
                className="text-xs text-primary font-bold hover:underline ml-1"
              >
                Limpar Filtros
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleGerarAutomaticos}
            disabled={gerandoAuto || loading || medicamentos.length === 0}
            className="no-print inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary px-3.5 py-2 text-xs font-bold hover:bg-primary/20 transition-colors disabled:opacity-50 shadow-2xs"
            title="Escaneia os medicamentos cadastrados no estoque e gera automaticamente os sinônimos oficiais reconhecidos da ANVISA/CMED"
          >
            {gerandoAuto ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Gerando Sinônimos...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Gerar Sinônimos Oficiais em Massa</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cadastro Rápido de Novo Sinônimo */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Plus className="h-4 w-4 text-primary" />
          <span>Vincular Novo Sinônimo Manual</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nome Comercial / Marca / Abreviação
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              value={sinonimo}
              onChange={(e) => setSinonimo(e.target.value)}
              placeholder="Ex.: Anador, Tylenol, AAS 100..."
              aria-label="Novo sinônimo"
            />
          </div>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold',
              'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs'
            )}
            onClick={handleCriar}
            disabled={loading || !medicamentoId || sinonimo.trim().length < 2}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Vincular Sinônimo
          </button>
        </div>

        {erro ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50 px-3 py-2 text-xs text-red-800 dark:text-red-300">
            {erro}
          </div>
        ) : null}
      </div>

      {/* Lista de Sinônimos Cadastrados */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Sinônimos Cadastrados ({itens ? itens.length : 0})
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {loading ? 'Carregando…' : `${(itens ?? []).length} registro(s)`}
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {(itens ?? []).length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400 space-y-2">
              <Tags className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Nenhum sinônimo encontrado.
              </p>
              <p className="text-xs">
                Utilize o botão &quot;Gerar Sinônimos Oficiais em Massa&quot; acima para vincular automaticamente as marcas oficiais aos seus medicamentos.
              </p>
            </div>
          ) : null}

          {(itens ?? []).map((r) => (
            <div
              key={r.id}
              className="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {r.sinonimo}
                  </p>
                  <span className="text-[11px] font-mono text-slate-400 bg-muted/60 px-1.5 py-0.5 rounded">
                    ({r.sinonimoNorm})
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Medicamento vinculado:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {r.medicamento?.nome}
                  </strong>{' '}
                  ({r.medicamento?.principioAtivo})
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                <button
                  type="button"
                  className={cn(
                    'rounded-xl px-2.5 py-1 text-xs font-semibold border transition-colors',
                    r.ativo
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  )}
                  onClick={() => handleAlternarAtivo(r.id, r.ativo)}
                  disabled={loading}
                  aria-label={r.ativo ? 'Desativar sinônimo' : 'Ativar sinônimo'}
                  title={r.ativo ? 'Clique para desativar' : 'Clique para ativar'}
                >
                  {r.ativo ? 'Ativo' : 'Inativo'}
                </button>

                <button
                  type="button"
                  onClick={() => handleAbrirEdicao(r)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 transition-colors"
                  title="Editar e corrigir nome, medicamento ou status"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSinonimoParaExcluir(r)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  title="Excluir sinônimo"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Edição / Correção */}
      {/* Modal de Edição / Correção */}
      {sinonimoEmEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="flex items-start justify-between gap-2 border-b border-border p-5 shrink-0">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-primary" />
                  <span>Editar Sinônimo / Abreviação</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Corrija a grafia, altere o medicamento vinculado ou o status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSinonimoEmEdicao(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nome Comercial / Sinônimo / Abreviação <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editSinonimo}
                  onChange={(e) => setEditSinonimo(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Ex.: Dipirona 500mg, Novalgina, AAS..."
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Permite letras maiúsculas e minúsculas com acentuação livre.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Medicamento Vinculado <span className="text-red-500">*</span>
                </label>
                <select
                  value={editMedicamentoId}
                  onChange={(e) => setEditMedicamentoId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Selecione um medicamento...</option>
                  {medicamentos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} — {m.principioAtivo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={editAtivo}
                    onChange={(e) => setEditAtivo(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Sinônimo Ativo para Buscas e Prescrições</span>
                </label>
              </div>

              {erroEdicao && (
                <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50 p-3 text-xs text-red-800 dark:text-red-300">
                  {erroEdicao}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/20 shrink-0">
              <button
                type="button"
                onClick={() => setSinonimoEmEdicao(null)}
                disabled={salvandoEdicao}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarEdicao}
                disabled={salvandoEdicao || editSinonimo.trim().length < 2 || !editMedicamentoId}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:brightness-95 transition-all shadow-sm disabled:opacity-50"
              >
                {salvandoEdicao ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {sinonimoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 p-5 border-b border-border shrink-0">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/50">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Excluir Sinônimo</h3>
                <p className="text-xs text-muted-foreground">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              <p className="text-sm text-foreground">
                Deseja realmente excluir o sinônimo{' '}
                <strong className="text-red-600 dark:text-red-400">
                  &ldquo;{sinonimoParaExcluir.sinonimo}&rdquo;
                </strong>{' '}
                vinculado ao medicamento{' '}
                <strong>{sinonimoParaExcluir.medicamento?.nome}</strong>?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/20 shrink-0">
              <button
                type="button"
                onClick={() => setSinonimoParaExcluir(null)}
                disabled={excluindo}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExcluirSinonimo}
                disabled={excluindo}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {excluindo ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Sim, Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
