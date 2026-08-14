'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Package, AlertCircle, CheckCircle2, Loader2, ChevronDown, ShieldAlert, UserCheck, Lock, HelpCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MedicamentoCatalogoItem = {
  id: string
  nome: string
  principioAtivo: string
  forma: string | null
  concentracao: string | null
  unidade: string | null
  saldoAtual: number
  estoqueMinimo: number
  mav?: boolean
  duplaChecagem?: boolean
  tipoControle?: string | null
  sinonimos?: { sinonimo: string }[]
}

interface BuscaMedicamentoEstoqueProps {
  valorNome: string
  onSelecionarMedicamento: (med: MedicamentoCatalogoItem) => void
  onNomeChange: (nome: string) => void
  erro?: string
}

export function BuscaMedicamentoEstoque({
  valorNome,
  onSelecionarMedicamento,
  onNomeChange,
  erro,
}: BuscaMedicamentoEstoqueProps) {
  const [busca, setBusca] = useState(valorNome)
  const [resultados, setResultados] = useState<MedicamentoCatalogoItem[]>([])
  const [carregando, setCarregando] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [exibirExplicacaoSeguranca, setExibirExplicacaoSeguranca] = useState(false)
  const [itemSelecionado, setItemSelecionado] = useState<MedicamentoCatalogoItem | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const buscarMedicamentos = useCallback(async (queryStr: string) => {
    setCarregando(true)
    try {
      const res = await fetch(`/api/farmacia/medicamentos?q=${encodeURIComponent(queryStr.trim())}`)
      const json = await res.json()
      if (json.sucesso && Array.isArray(json.dados)) {
        setResultados(json.dados)
      }
    } catch {
      /* ignorar erro */
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    setBusca(valorNome)
  }, [valorNome])

  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      buscarMedicamentos(busca)
    }, 250)

    return () => clearTimeout(timer)
  }, [busca, buscarMedicamentos])

  const handleAbrirDropdown = () => {
    setAberto((prev) => !prev)
    if (!aberto && resultados.length === 0) {
      buscarMedicamentos(busca)
    }
  }

  const handleSelecionar = (med: MedicamentoCatalogoItem) => {
    setItemSelecionado(med)
    setBusca(med.nome)
    onNomeChange(med.nome)
    onSelecionarMedicamento(med)
    setAberto(false)
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center">
        <Search className="h-4 w-4 absolute left-3 text-muted-foreground pointer-events-none z-10" />
        <input
          type="text"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value)
            onNomeChange(e.target.value)
            setItemSelecionado(null)
            setAberto(true)
          }}
          onFocus={() => {
            setAberto(true)
            if (resultados.length === 0) buscarMedicamentos(busca)
          }}
          placeholder="Selecione ou digite o nome / princípio ativo..."
          className={cn(
            'w-full pl-9 pr-9 py-2 text-sm border rounded-md bg-background outline-none transition-all',
            'focus:ring-2 focus:ring-primary/30 focus:border-primary',
            erro ? 'border-destructive' : 'border-input'
          )}
        />
        <button
          type="button"
          onClick={handleAbrirDropdown}
          className="absolute right-2.5 p-1 text-muted-foreground hover:text-foreground transition-colors"
          title="Abrir / Fechar lista de medicamentos"
          aria-label="Abrir lista de medicamentos"
        >
          {carregando ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className={cn('h-4 w-4 transition-transform', aberto && 'rotate-180')} />
          )}
        </button>
      </div>

      {/* Indicador persistente de saldo e alertas de segurança do item selecionado */}
      {itemSelecionado ? (
        <div className="mt-2 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {itemSelecionado.saldoAtual > 0 ? (
              <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Disponível em estoque ({itemSelecionado.saldoAtual} {itemSelecionado.unidade ?? 'un'})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">
                <AlertCircle className="h-3.5 w-3.5" />
                Sem estoque na farmácia (0 un)
              </span>
            )}

            {/* Badges Explicativos de Segurança com interatividade */}
            {itemSelecionado.mav ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-950/80 px-2 py-0.5 rounded-md border border-red-300 dark:border-red-800">
                <ShieldAlert className="h-3.5 w-3.5 text-red-700 dark:text-red-400" />
                MAV (Alta Vigilância)
              </span>
            ) : null}

            {itemSelecionado.duplaChecagem ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 dark:text-purple-200 bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-300 dark:border-purple-800">
                <UserCheck className="h-3.5 w-3.5 text-purple-700 dark:text-purple-400" />
                Dupla Checagem
              </span>
            ) : null}

            {itemSelecionado.tipoControle ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                <Lock className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                {itemSelecionado.tipoControle}
              </span>
            ) : null}

            {(itemSelecionado.mav || itemSelecionado.duplaChecagem || itemSelecionado.tipoControle) ? (
              <button
                type="button"
                onClick={() => setExibirExplicacaoSeguranca((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline ml-1"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                {exibirExplicacaoSeguranca ? 'Ocultar explicação' : 'Entender regras de segurança'}
              </button>
            ) : null}
          </div>

          {/* Card Expansível de Explicação dos Alertas */}
          {exibirExplicacaoSeguranca ? (
            <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/40 text-xs space-y-2 text-slate-800 dark:text-slate-200">
              <p className="font-bold flex items-center gap-1.5 text-blue-900 dark:text-blue-200">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                Protocolos de Segurança Médica do Medicamento Selecionado
              </p>

              {itemSelecionado.mav ? (
                <div className="pl-2 border-l-2 border-red-500">
                  <span className="font-bold text-red-700 dark:text-red-400">⚠️ MAV — Medicamento de Alta Vigilância:</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Possui alto risco de causar danos graves ou letais em caso de erro na dosagem, diluição ou administração ao paciente. Exige atenção redobrada do médico e da enfermagem.
                  </p>
                </div>
              ) : null}

              {itemSelecionado.duplaChecagem ? (
                <div className="pl-2 border-l-2 border-purple-500">
                  <span className="font-bold text-purple-700 dark:text-purple-300">🛡️ Exige Dupla Checagem à Beira Leito:</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    A administração deste remédio exige obrigatoriamente a conferência e confirmação por 2 profissionais de enfermagem distintos antes de ser injetado/oferecido ao paciente.
                  </p>
                </div>
              ) : null}

              {itemSelecionado.tipoControle ? (
                <div className="pl-2 border-l-2 border-amber-500">
                  <span className="font-bold text-amber-700 dark:text-amber-300">🔒 Sujeito a Controle Especial (Portaria 344/98 - {itemSelecionado.tipoControle}):</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Medicamento sujeito à retenção de receita / notificação especial de receita e controle estrito no livro de escrituração farmacêutica.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Dropdown Auto-Suggest / Combobox de Medicamentos */}
      {aberto ? (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-border">
          {resultados.length === 0 && !carregando ? (
            <div className="p-3 text-xs text-center text-muted-foreground">
              Nenhum medicamento encontrado para "{busca}".
            </div>
          ) : (
            resultados.map((med) => {
              const temEstoque = med.saldoAtual > 0
              const sinonimosTexto = med.sinonimos?.map((s) => s.sinonimo).join(', ')

              return (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => handleSelecionar(med)}
                  className="w-full text-left p-2.5 hover:bg-muted/70 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="truncate">{med.nome}</span>
                      {med.mav ? (
                        <span
                          className="px-1.5 py-0.2 text-[9px] font-bold bg-red-100 text-red-800 rounded border border-red-300 shrink-0"
                          title="Medicamento de Alta Vigilância"
                        >
                          MAV
                        </span>
                      ) : null}
                      {med.duplaChecagem ? (
                        <span
                          className="px-1.5 py-0.2 text-[9px] font-bold bg-purple-100 text-purple-800 rounded border border-purple-300 shrink-0"
                          title="Exige Dupla Checagem à Beira Leito"
                        >
                          Dupla Checagem
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {med.principioAtivo}
                      {med.concentracao ? ` • ${med.concentracao}` : ''}
                      {med.forma ? ` • ${med.forma}` : ''}
                    </div>
                    {sinonimosTexto ? (
                      <div className="text-[10px] text-primary/80 truncate">
                        Sinônimos: {sinonimosTexto}
                      </div>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-right">
                    {temEstoque ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/60 px-2 py-0.5 rounded-full border border-green-300 dark:border-green-800">
                        <Package className="h-3 w-3" />
                        {med.saldoAtual} {med.unidade ?? 'un'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded-full border border-red-300 dark:border-red-800">
                        <AlertCircle className="h-3 w-3" />
                        Sem estoque
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      ) : null}
    </div>
  )
}
