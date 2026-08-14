'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
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

  const [q, setQ] = useState(qInicial)
  const [medicamentoId, setMedicamentoId] = useState('')
  const [sinonimo, setSinonimo] = useState('')
  const [itens, setItens] = useState<SinonimoRow[] | null>(null)
  const [loading, setLoading] = useState(false)
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
      router.replace(`/farmacia/sinonimos?${params.toString()}`)
    } catch {
      setErro('Falha ao buscar sinônimos.')
      setItens([])
    } finally {
      setLoading(false)
    }
  }

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
      setSinonimo('')
      await handleBuscar()
    } catch {
      setErro('Falha ao criar sinônimo.')
    } finally {
      setLoading(false)
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-700">Medicamento (catálogo)</label>
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            value={medicamentoId}
            onChange={(e) => setMedicamentoId(e.target.value)}
            aria-label="Selecionar medicamento do catálogo"
          >
            <option value="">Selecione…</option>
            {medicamentos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome} — {m.principioAtivo}
              </option>
            ))}
          </select>
          {medicamentoSelecionado ? (
            <p className="text-xs text-slate-500 mt-1">
              Selecionado: <span className="font-semibold">{medicamentoSelecionado.nome}</span> (
              {medicamentoSelecionado.principioAtivo})
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700">Buscar (opcional)</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ex.: AAS, varfarina…"
            aria-label="Buscar sinônimos"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold',
            'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          onClick={handleBuscar}
          disabled={loading}
        >
          Buscar
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700">Novo sinônimo</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              value={sinonimo}
              onChange={(e) => setSinonimo(e.target.value)}
              placeholder="Ex.: AAS"
              aria-label="Novo sinônimo"
            />
          </div>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold',
              'bg-primary text-white hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            onClick={handleCriar}
            disabled={loading || !medicamentoId || sinonimo.trim().length < 2}
          >
            Adicionar
          </button>
        </div>

        {erro ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sinônimos cadastrados</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{loading ? 'Carregando…' : `${(itens ?? []).length} itens`}</p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {(itens ?? []).length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">Nenhum sinônimo encontrado. Clique em “Buscar”.</div>
          ) : null}

          {(itens ?? []).map((r) => (
            <div key={r.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {r.sinonimo}{' '}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({r.sinonimoNorm})</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {r.medicamento?.nome} — {r.medicamento?.principioAtivo}
                </p>
              </div>

              <button
                type="button"
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-semibold border',
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
