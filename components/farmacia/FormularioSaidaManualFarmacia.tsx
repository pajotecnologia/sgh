'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2 } from 'lucide-react'

type MedicamentoOption = { id: string; nome: string; principioAtivo: string; saldoAtual: number }

type LinhaItem = {
  medicamentoId: string
  quantidade: string
  motivo: string
}

export function FormularioSaidaManualFarmacia({ medicamentos }: { medicamentos: MedicamentoOption[] }) {
  const router = useRouter()
  const [tipo, setTipo] = useState<
    'BAIXA_MANUAL' | 'SAIDA_SEM_NOTA' | 'EMPRESTIMO_SAIDA' | 'PERDA_AVARIA_VALIDADE' | 'DEVOLUCAO_FORNECEDOR' | 'OUTRAS_SAIDAS'
  >('BAIXA_MANUAL')
  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState<LinhaItem[]>([{ medicamentoId: '', quantidade: '1', motivo: '' }])
  const [salvando, setSalvando] = useState(false)

  const mapMed = useMemo(() => new Map(medicamentos.map((m) => [m.id, m])), [medicamentos])

  const handleAddItem = () => setItens((p) => [...p, { medicamentoId: '', quantidade: '1', motivo: '' }])
  const handleRemoveItem = (idx: number) => setItens((p) => p.filter((_, i) => i !== idx))
  const handleUpdateItem = (idx: number, patch: Partial<LinhaItem>) =>
    setItens((p) => p.map((it, i) => (i === idx ? { ...it, ...patch } : it)))

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    const itensValidos = itens
      .map((it) => {
        const quantidade = Number(it.quantidade)
        return {
          medicamentoId: it.medicamentoId,
          quantidade: Number.isFinite(quantidade) ? quantidade : 0,
          motivo: it.motivo.trim() || null,
        }
      })
      .filter((x) => x.medicamentoId && x.quantidade >= 1)

    if (itensValidos.length === 0) {
      toast.error('Adicione ao menos 1 item válido.')
      return
    }

    setSalvando(true)
    try {
      const res = await fetch('/api/farmacia/saidas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tipo,
          observacoes: observacoes.trim() || null,
          itens: itensValidos,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(json?.erro ?? 'Falha ao registrar saída.')
        return
      }
      toast.success('Saída registrada e saldo atualizado.')
      router.push(`/farmacia/saidas/${json.dados.id}`)
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
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tipo de Saída *</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as any)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="BAIXA_MANUAL">Baixa Manual / Ajuste de Estoque</option>
            <option value="SAIDA_SEM_NOTA">Saída sem Nota / Consumo Interno</option>
            <option value="EMPRESTIMO_SAIDA">Empréstimo Concedido (Saída a outra instituição)</option>
            <option value="PERDA_AVARIA_VALIDADE">Baixa por Perda, Avaria ou Vencimento de Validade</option>
            <option value="DEVOLUCAO_FORNECEDOR">Devolução ao Fornecedor</option>
            <option value="OUTRAS_SAIDAS">Outras Saídas</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Observações (opcional)</label>
          <input
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Observações da saída"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Itens da saída</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Debita saldo do catálogo.</p>
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
            const saldo = med?.saldoAtual ?? null
            return (
              <div key={idx} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-5">
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
                        {m.nome} — {m.principioAtivo} (saldo {m.saldoAtual})
                      </option>
                    ))}
                  </select>
                  {med ? (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Saldo atual: <span className="font-mono font-bold">{saldo}</span>
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

                <div className="md:col-span-3">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Motivo (opcional)</label>
                  <input
                    value={it.motivo}
                    onChange={(e) => handleUpdateItem(idx, { motivo: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label="Motivo"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={itens.length === 1}
                    className="no-print inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs font-semibold text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 disabled:opacity-50 w-full transition-colors"
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                    <span>Remover</span>
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
        Registrar saída (baixa manual)
      </button>
    </form>
  )
}
