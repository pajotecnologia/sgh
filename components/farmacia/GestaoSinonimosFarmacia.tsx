'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { toast } from 'sonner'
import { Sparkles, Loader2, Search, Plus, Tags, CheckCircle2 } from 'lucide-react'
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
              className="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {r.sinonimo}
                  </p>
                  <span className="text-[11px] font-mono text-slate-400">
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

              <button
                type="button"
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-semibold border transition-colors self-start md:self-center',
                  r.ativo
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                )}
                onClick={() => handleAlternarAtivo(r.id, r.ativo)}
                disabled={loading}
                aria-label={r.ativo ? 'Desativar sinônimo' : 'Ativar sinônimo'}
              >
                {r.ativo ? 'Ativo' : 'Inativo'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
