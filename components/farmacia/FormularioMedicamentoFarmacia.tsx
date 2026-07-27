'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function FormularioMedicamentoFarmacia() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [principioAtivo, setPrincipioAtivo] = useState('')
  const [forma, setForma] = useState('')
  const [concentracao, setConcentracao] = useState('')
  const [unidade, setUnidade] = useState('')
  const [saldoAtual, setSaldoAtual] = useState('0')
  const [estoqueMinimo, setEstoqueMinimo] = useState('0')
  const [salvando, setSalvando] = useState(false)

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const res = await fetch('/api/farmacia/medicamentos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nome,
          principioAtivo,
          forma: forma.trim() || null,
          concentracao: concentracao.trim() || null,
          unidade: unidade.trim() || null,
          saldoAtual: Number.isFinite(Number(saldoAtual)) ? Number(saldoAtual) : 0,
          estoqueMinimo: Number.isFinite(Number(estoqueMinimo)) ? Number(estoqueMinimo) : 0,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(json?.erro ?? 'Falha ao salvar medicamento.')
        return
      }
      toast.success('Medicamento cadastrado.')
      router.push(`/farmacia/medicamentos/${json.dados.id}`)
      router.refresh()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSalvar} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-700">Nome</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Ex.: AAS"
            aria-label="Nome do medicamento"
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700">Princípio ativo</label>
          <input
            value={principioAtivo}
            onChange={(e) => setPrincipioAtivo(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Ex.: ácido acetilsalicílico"
            aria-label="Princípio ativo"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-700">Forma (opcional)</label>
          <input
            value={forma}
            onChange={(e) => setForma(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Ex.: comprimido"
            aria-label="Forma farmacêutica"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700">Concentração (opcional)</label>
          <input
            value={concentracao}
            onChange={(e) => setConcentracao(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Ex.: 100mg"
            aria-label="Concentração"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700">Unidade (opcional)</label>
          <input
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Ex.: comp"
            aria-label="Unidade"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="text-xs font-semibold text-slate-700">Saldo inicial</label>
          <input
            value={saldoAtual}
            onChange={(e) => setSaldoAtual(e.target.value)}
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Saldo inicial"
          />
          <p className="text-[11px] text-slate-500 mt-1">Para entrada por NF, use o submenu Entradas.</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700">Estoque mínimo</label>
          <input
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(e.target.value)}
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Estoque mínimo"
          />
          <p className="text-[11px] text-slate-500 mt-1">Alerta no relatório de estoque mínimo.</p>
        </div>

        <button
          type="submit"
          disabled={salvando}
          className="md:col-span-3 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-4 py-2 text-sm font-semibold hover:brightness-95 disabled:opacity-50"
        >
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Salvar
        </button>
      </div>
    </form>
  )
}
