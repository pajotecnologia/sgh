'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, ShieldAlert, UserCheck, Lock } from 'lucide-react'

export function FormularioMedicamentoFarmacia() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [principioAtivo, setPrincipioAtivo] = useState('')
  const [codigoEan, setCodigoEan] = useState('')
  const [codigoAnvisa, setCodigoAnvisa] = useState('')
  const [forma, setForma] = useState('')
  const [concentracao, setConcentracao] = useState('')
  const [unidade, setUnidade] = useState('')
  const [mav, setMav] = useState(false)
  const [duplaChecagem, setDuplaChecagem] = useState(false)
  const [tipoControle, setTipoControle] = useState('')
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
          nome: nome.trim(),
          principioAtivo: principioAtivo.trim(),
          codigoEan: codigoEan.trim() || null,
          codigoAnvisa: codigoAnvisa.trim() || null,
          forma: forma.trim() || null,
          concentracao: concentracao.trim() || null,
          unidade: unidade.trim() || null,
          mav,
          duplaChecagem,
          tipoControle: tipoControle.trim() || null,
          saldoAtual: Number.isFinite(Number(saldoAtual)) ? Number(saldoAtual) : 0,
          estoqueMinimo: Number.isFinite(Number(estoqueMinimo)) ? Number(estoqueMinimo) : 0,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(json?.erro ?? 'Falha ao salvar medicamento.')
        return
      }
      toast.success('Medicamento cadastrado com sucesso!')
      router.push(`/cadastros/medicamentos/${json.dados.id}`)
      router.refresh()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setSalvando(false)
    }
  }
  return (
    <form onSubmit={handleSalvar} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nome Comercial *</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Ex.: Novalgina"
            aria-label="Nome do medicamento"
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Princípio Ativo *</label>
          <input
            value={principioAtivo}
            onChange={(e) => setPrincipioAtivo(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Ex.: Dipirona Monoidratada"
            aria-label="Princípio ativo"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Código EAN (Barras)</label>
          <input
            value={codigoEan}
            onChange={(e) => setCodigoEan(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm font-mono"
            placeholder="Ex.: 7891234567890"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Registro ANVISA</label>
          <input
            value={codigoAnvisa}
            onChange={(e) => setCodigoAnvisa(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm font-mono"
            placeholder="Ex.: 1012345670089"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Forma Farmacêutica</label>
          <input
            value={forma}
            onChange={(e) => setForma(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
            placeholder="Ex.: Solução Injetável"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Concentração</label>
          <input
            value={concentracao}
            onChange={(e) => setConcentracao(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
            placeholder="Ex.: 500 mg/mL"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Unidade de Medida</label>
          <input
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
            placeholder="Ex.: AMP, COMP, FR"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tipo de Controle (Portaria 344)</label>
          <input
            value={tipoControle}
            onChange={(e) => setTipoControle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
            placeholder="Ex.: A1, B1, C1 (Isento se em branco)"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Estoque Mínimo (Alerta)</label>
          <input
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(e.target.value)}
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm font-mono"
          />
        </div>
      </div>

      {/* Regras e Alertas de Segurança */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Controles de Segurança e Protocolos Hospitalares (Pacientes)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <label className="flex items-start gap-2.5 cursor-pointer bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-red-300 transition-colors">
            <input
              type="checkbox"
              checked={mav}
              onChange={(e) => setMav(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-primary"
            />
            <div>
              <span className="font-bold text-red-700 dark:text-red-400 flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5" /> Medicamento de Alta Vigilância (MAV)
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-normal">
                <strong>O que significa:</strong> Remédios com elevado risco de causar danos graves ou fatais ao paciente em caso de erro (ex.: Insulinas, Opioides, Anticoagulantes, Cloreto de Potássio concentrado). Alerta a equipe médica e de enfermagem.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-purple-300 transition-colors">
            <input
              type="checkbox"
              checked={duplaChecagem}
              onChange={(e) => setDuplaChecagem(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-primary"
            />
            <div>
              <span className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" /> Exige Dupla Checagem à Beira Leito
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-normal">
                <strong>O que significa:</strong> Obriga que 2 profissionais de enfermagem distintos façam a conferência independente (Paciente Certo, Dose Certa, Via Certa) antes da administração à beira do leito.
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center pt-2">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Saldo Inicial</label>
          <input
            value={saldoAtual}
            onChange={(e) => setSaldoAtual(e.target.value)}
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={salvando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-bold hover:brightness-95 disabled:opacity-50 shadow-md self-end"
        >
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Cadastrar Medicamento
        </button>
      </div>
    </form>
  )
}

