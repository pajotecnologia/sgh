'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn, mascaraCnpj } from '@/lib/utils'
import { Loader2, Plus, Trash2, Truck } from 'lucide-react'
import Link from 'next/link'

type MedicamentoOption = { id: string; nome: string; principioAtivo: string }

type FornecedorOption = {
  id: string
  razaoSocial: string
  nomeFantasia: string | null
  cnpj: string
}

type LinhaItem = {
  medicamentoId: string
  quantidade: string
  custoUnitario: string
  lote: string
  validade: string
}

export function FormularioEntradaNfFarmacia({ medicamentos }: { medicamentos: MedicamentoOption[] }) {
  const router = useRouter()
  const [tipo, setTipo] = useState<'ENTRADA_NF' | 'ENTRADA_SEM_NOTA' | 'EMPRESTIMO_ENTRADA' | 'DEVOLUCAO_PACIENTE' | 'OUTRAS_ENTRADAS'>('ENTRADA_NF')
  const [numeroNota, setNumeroNota] = useState('')
  const [serie, setSerie] = useState('')
  
  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([])
  const [fornecedorId, setFornecedorId] = useState('')
  const [fornecedorNome, setFornecedorNome] = useState('')
  const [fornecedorCnpj, setFornecedorCnpj] = useState('')
  
  const [emitidaEm, setEmitidaEm] = useState('')
  const [recebidaEm, setRecebidaEm] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState<LinhaItem[]>([
    { medicamentoId: '', quantidade: '1', custoUnitario: '', lote: '', validade: '' },
  ])
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetch('/api/farmacia/fornecedores')
      .then((res) => res.json())
      .then((json) => {
        if (json.sucesso && Array.isArray(json.dados)) {
          setFornecedores(json.dados)
        }
      })
      .catch(() => {})
  }, [])

  const handleSelecionarFornecedor = (id: string) => {
    setFornecedorId(id)
    if (!id) return
    const f = fornecedores.find((x) => x.id === id)
    if (f) {
      setFornecedorNome(f.razaoSocial)
      setFornecedorCnpj(f.cnpj)
    }
  }

  const mapMed = useMemo(() => new Map(medicamentos.map((m) => [m.id, m])), [medicamentos])

  const handleAddItem = () => {
    setItens((prev) => [...prev, { medicamentoId: '', quantidade: '1', custoUnitario: '', lote: '', validade: '' }])
  }

  const handleRemoveItem = (idx: number) => {
    setItens((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleUpdateItem = (idx: number, patch: Partial<LinhaItem>) => {
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  const totalQuantidade = useMemo(
    () =>
      itens.reduce((acc, it) => {
        const q = Number(it.quantidade)
        return acc + (Number.isFinite(q) ? q : 0)
      }, 0),
    [itens]
  )

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!numeroNota.trim()) {
      toast.error('Informe o número da nota.')
      return
    }

    const itensValidos = itens
      .map((it) => {
        const quantidade = Number(it.quantidade)
        const custoUnitario = it.custoUnitario.trim() ? Number(it.custoUnitario) : null
        return {
          medicamentoId: it.medicamentoId,
          quantidade: Number.isFinite(quantidade) ? quantidade : 0,
          custoUnitario: custoUnitario != null && Number.isFinite(custoUnitario) ? custoUnitario : null,
          lote: it.lote.trim() || null,
          validade: it.validade || null,
        }
      })
      .filter((x) => x.medicamentoId && x.quantidade >= 1)

    if (itensValidos.length === 0) {
      toast.error('Adicione ao menos 1 item válido.')
      return
    }

    setSalvando(true)
    try {
      const res = await fetch('/api/farmacia/entradas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tipo,
          numeroNota,
          serie: serie.trim() || null,
          fornecedorId: fornecedorId || null,
          fornecedorNome: fornecedorNome.trim() || null,
          fornecedorCnpj: fornecedorCnpj.trim() || null,
          emitidaEm: emitidaEm || null,
          recebidaEm: recebidaEm || null,
          observacoes: observacoes.trim() || null,
          itens: itensValidos,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(json?.erro ?? 'Erro ao salvar entrada.')
        return
      }
      toast.success('Entrada salva com sucesso!')
      router.push(`/farmacia/entradas/${json.dados.id}`)
      router.refresh()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSalvar} className="space-y-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tipo de Entrada *</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as any)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="ENTRADA_NF">Entrada com Nota Fiscal (NF-e / DANFE)</option>
            <option value="ENTRADA_SEM_NOTA">Entrada sem Nota (Avulsa / Doação / Saldo Inicial)</option>
            <option value="EMPRESTIMO_ENTRADA">Empréstimo Recebido (Entrada por empréstimo)</option>
            <option value="DEVOLUCAO_PACIENTE">Devolução de Paciente</option>
            <option value="OUTRAS_ENTRADAS">Outras Entradas</option>
          </select>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-primary" />
              Fornecedor Cadastrado
            </label>
            <Link
              href="/farmacia/fornecedores"
              target="_blank"
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              + Gerenciar / Cadastrar Fornecedores
            </Link>
          </div>
          <select
            value={fornecedorId}
            onChange={(e) => handleSelecionarFornecedor(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-medium"
          >
            <option value="">Selecione um fornecedor do catálogo (ou digite manualmente abaixo)...</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.razaoSocial} {f.nomeFantasia ? `(${f.nomeFantasia})` : ''} — CNPJ: {f.cnpj}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Número da NF</label>
            <input
              value={numeroNota}
              onChange={(e) => setNumeroNota(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Número da nota fiscal"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Série (opcional)</label>
            <input
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Série da nota"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Fornecedor CNPJ (opcional)</label>
            <input
              value={fornecedorCnpj}
              onChange={(e) => setFornecedorCnpj(mascaraCnpj(e.target.value))}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono"
              aria-label="CNPJ do fornecedor"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Razão Social / Nome do Fornecedor</label>
            <input
              value={fornecedorNome}
              onChange={(e) => setFornecedorNome(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Nome do fornecedor"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Emitida em (opcional)</label>
            <input
              type="date"
              value={emitidaEm}
              onChange={(e) => setEmitidaEm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Data de emissão"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Recebida em (opcional)</label>
            <input
              type="date"
              value={recebidaEm}
              onChange={(e) => setRecebidaEm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Data de recebimento"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Observações (opcional)</label>
            <input
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Observações"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Itens da NF</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total de quantidade: {totalQuantidade}</p>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="no-print inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-label="Adicionar item"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Adicionar item
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {itens.map((it, idx) => {
            const med = it.medicamentoId ? mapMed.get(it.medicamentoId) : null
            return (
              <div key={idx} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Medicamento</label>
                  <select
                    value={it.medicamentoId}
                    onChange={(e) => handleUpdateItem(idx, { medicamentoId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label="Selecionar medicamento"
                  >
                    <option value="">Selecione…</option>
                    {medicamentos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} — {m.principioAtivo}
                      </option>
                    ))}
                  </select>
                  {med ? (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <span className="font-semibold">{med.nome}</span> ({med.principioAtivo})
                    </p>
                  ) : null}
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quantidade</label>
                  <input
                    value={it.quantidade}
                    onChange={(e) => handleUpdateItem(idx, { quantidade: e.target.value })}
                    inputMode="numeric"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                    aria-label="Quantidade"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Custo unit. (opcional)</label>
                  <input
                    value={it.custoUnitario}
                    onChange={(e) => handleUpdateItem(idx, { custoUnitario: e.target.value })}
                    inputMode="decimal"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                    aria-label="Custo unitário"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Lote (opcional)</label>
                  <input
                    value={it.lote}
                    onChange={(e) => handleUpdateItem(idx, { lote: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                    aria-label="Lote"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Validade</label>
                  <input
                    type="date"
                    value={it.validade}
                    onChange={(e) => handleUpdateItem(idx, { validade: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label="Validade"
                  />
                </div>

                <div className="md:col-span-12 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={itens.length === 1}
                    className="no-print inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs font-semibold text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/80 disabled:opacity-50"
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Remover
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={salvando}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-white px-4 py-2 text-sm font-semibold hover:brightness-95 disabled:opacity-50"
      >
        {salvando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Registrar entrada
      </button>
    </form>
  )
}
