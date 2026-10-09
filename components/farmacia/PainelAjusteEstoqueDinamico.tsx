// components/farmacia/PainelAjusteEstoqueDinamico.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Search,
  SlidersHorizontal,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Calendar,
  Building2,
  Package,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LoteItem {
  id?: string
  lote: string
  validade?: string | null
  quantidade: number
}

export interface MedicamentoEstoque {
  id: string
  nome: string
  principioAtivo: string
  forma?: string | null
  concentracao?: string | null
  unidade?: string | null
  codigoEan?: string | null
  tipoItem: string
  localizacaoFisica?: string | null
  saldoAtual: number
  estoqueMinimo: number
  lotes: Array<{
    id: string
    lote: string
    validade?: string | null
    quantidade: number
  }>
}

export interface ItemAjusteEstado {
  medicamentoId: string
  novoSaldoTotal: number
  lotes: LoteItem[]
  motivoItem?: string
  modificado: boolean
}

const MOTIVOS_PADRAO = [
  'INVENTÁRIO / CONTAGEM FÍSICA PERIÓDICA',
  'ACERTO DE DIVERGÊNCIA DE CONTAGEM',
  'PERDA POR AVARIA / QUEBRA / DERRAMAMENTO',
  'PERDA POR VENCIMENTO / DESCARTE SANITÁRIO',
  'TRANSFERÊNCIA ENTRE SETORES / ALMOXARIFADO',
  'RETIFICAÇÃO DE ENTRADA / NOTA FISCAL',
  'OUTROS (DESCRITO NAS OBSERVAÇÕES)',
]

export function PainelAjusteEstoqueDinamico() {
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [medicamentos, setMedicamentos] = useState<MedicamentoEstoque[]>([])

  // Filtros
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('TODOS')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [filtroLocalizacao, setFiltroLocalizacao] = useState('TODOS')

  // Cabeçalho do Ajuste Geral
  const [motivoGeral, setMotivoGeral] = useState(MOTIVOS_PADRAO[0])
  const [observacoesGerais, setObservacoesGerais] = useState('')
  const [dataAjuste, setDataAjuste] = useState(new Date().toISOString().split('T')[0])

  // Estado dos Ajustes (chave: medicamentoId)
  const [ajustes, setAjustes] = useState<Record<string, ItemAjusteEstado>>({})
  const [linhasExpandidas, setLinhasExpandidas] = useState<Record<string, boolean>>({})

  // Modal de Confirmação
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false)

  async function carregarCatalogo() {
    try {
      setCarregando(true)
      const params = new URLSearchParams()
      if (busca.trim()) params.set('q', busca.trim())
      if (filtroTipo !== 'TODOS') params.set('tipoItem', filtroTipo)
      if (filtroStatus !== 'TODOS' && filtroStatus !== 'APENAS_MODIFICADOS') {
        params.set('statusEstoque', filtroStatus)
      }
      if (filtroLocalizacao !== 'TODOS') params.set('localizacao', filtroLocalizacao)

      const res = await fetch(`/api/farmacia/ajuste-estoque-massa?${params.toString()}`)
      const json = await res.json()
      if (json.sucesso && Array.isArray(json.dados)) {
        setMedicamentos(json.dados)
      } else {
        toast.error(json.erro || 'Erro ao carregar catálogo.')
      }
    } catch {
      toast.error('Erro de conexão ao carregar medicamentos.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarCatalogo()
  }, [filtroTipo, filtroStatus, filtroLocalizacao])

  // Lista única de localizações físicas
  const localizacoesDisponiveis = useMemo(() => {
    const locs = new Set<string>()
    medicamentos.forEach((m) => {
      if (m.localizacaoFisica?.trim()) locs.add(m.localizacaoFisica.trim())
    })
    return Array.from(locs).sort()
  }, [medicamentos])

  // Lista filtrada no client
  const medicamentosFiltrados = useMemo(() => {
    return medicamentos.filter((m) => {
      if (busca.trim()) {
        const termo = busca.toLowerCase()
        const matchNome = m.nome.toLowerCase().includes(termo)
        const matchPrincipio = m.principioAtivo?.toLowerCase().includes(termo)
        const matchEan = m.codigoEan?.toLowerCase().includes(termo)
        if (!matchNome && !matchPrincipio && !matchEan) return false
      }
      if (filtroStatus === 'APENAS_MODIFICADOS') {
        const aj = ajustes[m.id]
        if (!aj || !aj.modificado) return false
      }
      return true
    })
  }, [medicamentos, busca, filtroStatus, ajustes])

  // Lista de itens efetivamente modificados
  const itensModificados = useMemo(() => {
    return Object.values(ajustes).filter((aj) => aj.modificado)
  }, [ajustes])

  // Estatísticas de divergência dos itens modificados
  const estatisticasModificados = useMemo(() => {
    let entradasTotal = 0
    let saidasTotal = 0
    let qtdItensAumento = 0
    let qtdItensReducao = 0

    itensModificados.forEach((aj) => {
      const med = medicamentos.find((m) => m.id === aj.medicamentoId)
      if (!med) return
      const dif = aj.novoSaldoTotal - med.saldoAtual
      if (dif > 0) {
        entradasTotal += dif
        qtdItensAumento++
      } else if (dif < 0) {
        saidasTotal += Math.abs(dif)
        qtdItensReducao++
      }
    })

    return {
      totalItens: itensModificados.length,
      entradasTotal,
      saidasTotal,
      qtdItensAumento,
      qtdItensReducao,
    }
  }, [itensModificados, medicamentos])

  function obterEstadoItem(med: MedicamentoEstoque): ItemAjusteEstado {
    if (ajustes[med.id]) return ajustes[med.id]
    return {
      medicamentoId: med.id,
      novoSaldoTotal: med.saldoAtual,
      lotes: med.lotes.map((l) => ({
        id: l.id,
        lote: l.lote,
        validade: l.validade ? l.validade.split('T')[0] : '',
        quantidade: l.quantidade,
      })),
      modificado: false,
    }
  }

  function handleAlterarSaldoDireto(med: MedicamentoEstoque, novoValor: number) {
    const estadoAtual = obterEstadoItem(med)
    const saldoValido = Math.max(0, isNaN(novoValor) ? 0 : novoValor)
    const modificado = saldoValido !== med.saldoAtual

    setAjustes((prev) => ({
      ...prev,
      [med.id]: {
        ...estadoAtual,
        novoSaldoTotal: saldoValido,
        modificado,
      },
    }))
  }

  function handleAlterarQuantidadeLote(med: MedicamentoEstoque, indexLote: number, novaQtd: number) {
    const estadoAtual = obterEstadoItem(med)
    const novosLotes = [...estadoAtual.lotes]
    const qtdValida = Math.max(0, isNaN(novaQtd) ? 0 : novaQtd)

    novosLotes[indexLote] = {
      ...novosLotes[indexLote],
      quantidade: qtdValida,
    }

    const novoSaldoTotal = novosLotes.reduce((sum, l) => sum + l.quantidade, 0)
    const modificado = novoSaldoTotal !== med.saldoAtual || JSON.stringify(novosLotes) !== JSON.stringify(med.lotes)

    setAjustes((prev) => ({
      ...prev,
      [med.id]: {
        ...estadoAtual,
        lotes: novosLotes,
        novoSaldoTotal,
        modificado,
      },
    }))
  }

  function handleAdicionarNovoLote(med: MedicamentoEstoque) {
    const estadoAtual = obterEstadoItem(med)
    const novoLoteItem: LoteItem = {
      lote: `LT-${new Date().getFullYear()}-${String(estadoAtual.lotes.length + 1).padStart(2, '0')}`,
      validade: '',
      quantidade: 0,
    }
    const novosLotes = [...estadoAtual.lotes, novoLoteItem]

    setAjustes((prev) => ({
      ...prev,
      [med.id]: {
        ...estadoAtual,
        lotes: novosLotes,
        modificado: true,
      },
    }))
    setLinhasExpandidas((prev) => ({ ...prev, [med.id]: true }))
  }

  function handleRemoverLote(med: MedicamentoEstoque, indexLote: number) {
    const estadoAtual = obterEstadoItem(med)
    const novosLotes = estadoAtual.lotes.filter((_, idx) => idx !== indexLote)
    const novoSaldoTotal = novosLotes.reduce((sum, l) => sum + l.quantidade, 0)

    setAjustes((prev) => ({
      ...prev,
      [med.id]: {
        ...estadoAtual,
        lotes: novosLotes,
        novoSaldoTotal,
        modificado: true,
      },
    }))
  }

  function handleDesfazerItem(medId: string) {
    setAjustes((prev) => {
      const copy = { ...prev }
      delete copy[medId]
      return copy
    })
    toast.info('Alteração do item descartada.')
  }

  function handleLimparTodosAjustes() {
    if (itensModificados.length === 0) return
    if (!confirm('Deseja realmente descartar todos os ajustes pendentes não salvos?')) return
    setAjustes({})
    toast.info('Todos os ajustes pendentes foram descartados.')
  }

  async function salvarTodosAjustes() {
    if (itensModificados.length === 0) {
      toast.warning('Nenhum item foi modificado para gravação.')
      return
    }

    if (!motivoGeral?.trim()) {
      toast.error('Informe o motivo geral do ajuste antes de gravar.')
      return
    }

    try {
      setSalvando(true)
      const payload = {
        motivoGeral: motivoGeral.trim(),
        observacoesGerais: observacoesGerais.trim() || null,
        dataAjuste,
        itens: itensModificados.map((it) => ({
          medicamentoId: it.medicamentoId,
          novoSaldoTotal: it.novoSaldoTotal,
          lotes: it.lotes.map((l) => ({
            id: l.id,
            lote: l.lote,
            validade: l.validade || null,
            quantidade: l.quantidade,
          })),
          motivoItem: it.motivoItem || null,
        })),
      }

      const res = await fetch('/api/farmacia/ajuste-estoque-massa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok || !json.sucesso) {
        toast.error(json.erro || 'Erro ao gravar ajustes de estoque.')
        return
      }

      toast.success(json.mensagem || 'Ajustes de estoque gravados com sucesso!')
      setAjustes({})
      setModalConfirmacaoAberto(false)
      await carregarCatalogo()
    } catch {
      toast.error('Erro de conexão ao gravar ajustes.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-4 max-w-[96rem] mx-auto pb-20">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                Ajuste Dinâmico de Estoque & Inventário em Lote
              </h2>
              <p className="text-xs text-muted-foreground">
                Contagem física, acerto de divergências e lançamento de lotes gravados em transação única
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {itensModificados.length > 0 && (
              <button
                type="button"
                onClick={handleLimparTodosAjustes}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Descartar Alterações
              </button>
            )}

            <button
              type="button"
              onClick={() => setModalConfirmacaoAberto(true)}
              disabled={itensModificados.length === 0 || salvando}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all',
                itensModificados.length > 0
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
              )}
            >
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Gravar Todos os Ajustes ({itensModificados.length})</span>
            </button>
          </div>
        </div>

        {/* PARÂMETROS DO AJUSTE EM MASSA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Motivo do Ajuste *
            </label>
            <select
              value={motivoGeral}
              onChange={(e) => setMotivoGeral(e.target.value)}
              className="w-full border border-input rounded-lg px-2.5 py-1.5 bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {MOTIVOS_PADRAO.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Data do Ajuste
            </label>
            <input
              type="date"
              value={dataAjuste}
              onChange={(e) => setDataAjuste(e.target.value)}
              className="w-full border border-input rounded-lg px-2.5 py-1.5 bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Observações Gerais / Justificativa da Sessão
            </label>
            <input
              type="text"
              value={observacoesGerais}
              onChange={(e) => setObservacoesGerais(e.target.value)}
              placeholder="Ex: Contagem de inventário mensal realizada pela comissão de farmácia..."
              className="w-full border border-input rounded-lg px-2.5 py-1.5 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* BUSCA RÁPIDA */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, princípio ou EAN..."
              className="w-full pl-8 pr-3 py-1.5 border border-input rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* TIPO DE ITEM */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border border-input rounded-lg px-2.5 py-1.5 bg-background text-xs font-medium"
          >
            <option value="TODOS">Tipo: Todos os Itens</option>
            <option value="MEDICAMENTO">Apenas Medicamentos</option>
            <option value="MATERIAL">Apenas Materiais</option>
            <option value="INSUMO">Apenas Insumos</option>
            <option value="PROCEDIMENTO">Procedimentos</option>
          </select>

          {/* SITUAÇÃO DE ESTOQUE */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border border-input rounded-lg px-2.5 py-1.5 bg-background text-xs font-medium"
          >
            <option value="TODOS">Situação: Todos os Saldos</option>
            <option value="COM_ESTOQUE">Com Saldo em Estoque (&gt; 0)</option>
            <option value="ZERADOS">Estoque Zerado (= 0)</option>
            <option value="ESTOQUE_BAIXO">Abaixo do Estoque Mínimo</option>
            <option value="VENCIMENTO_PROXIMO">Lote Próximo ao Vencimento (&lt; 90d)</option>
            <option value="APENAS_MODIFICADOS">🔥 Apenas Modificados ({itensModificados.length})</option>
          </select>

          {/* LOCALIZAÇÃO FÍSICA */}
          <select
            value={filtroLocalizacao}
            onChange={(e) => setFiltroLocalizacao(e.target.value)}
            className="border border-input rounded-lg px-2.5 py-1.5 bg-background text-xs font-medium"
          >
            <option value="TODOS">Localização: Todas as Prateleiras</option>
            {localizacoesDisponiveis.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* STATS RÁPIDOS */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              Total listado: <strong className="text-foreground">{medicamentosFiltrados.length}</strong> itens
            </span>
            {itensModificados.length > 0 && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {itensModificados.length} alteração(ões) pendente(s)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {estatisticasModificados.entradasTotal > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> +{estatisticasModificados.entradasTotal} un (Entradas)
              </span>
            )}
            {estatisticasModificados.saidasTotal > 0 && (
              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <TrendingDown className="h-3.5 w-3.5" /> -{estatisticasModificados.saidasTotal} un (Baixas)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* TABELA DE ITENS */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {carregando ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-medium">Carregando catálogo de estoque...</p>
          </div>
        ) : medicamentosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-xs space-y-2">
            <Package className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="font-semibold text-foreground">Nenhum medicamento encontrado para os filtros selecionados.</p>
            <p>Tente alterar o termo de busca ou limpar os filtros de situação de estoque.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-2.5 px-3">Item / Princípio Ativo</th>
                  <th className="py-2.5 px-3">Tipo & Localização</th>
                  <th className="py-2.5 px-3 text-right">Saldo Atual</th>
                  <th className="py-2.5 px-3 text-center min-w-[140px]">Novo Saldo Contado</th>
                  <th className="py-2.5 px-3 text-center">Diferença</th>
                  <th className="py-2.5 px-3 text-center">Lotes & Validades</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {medicamentosFiltrados.map((med) => {
                  const estado = obterEstadoItem(med)
                  const diferenca = estado.novoSaldoTotal - med.saldoAtual
                  const expandido = Boolean(linhasExpandidas[med.id])

                  return (
                    <tr
                      key={med.id}
                      className={cn(
                        'transition-colors',
                        estado.modificado
                          ? 'bg-primary/5 dark:bg-primary/10 hover:bg-primary/10'
                          : 'hover:bg-muted/30'
                      )}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-foreground text-xs leading-tight">{med.nome}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {med.principioAtivo || '—'} {med.concentracao ? `• ${med.concentracao}` : ''}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-bold uppercase text-foreground">
                            {med.tipoItem}
                          </span>
                          {med.unidade && (
                            <span className="text-[10px] text-muted-foreground">{med.unidade}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {med.localizacaoFisica || 'Local não informado'}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-xs">
                        <span className={med.saldoAtual <= med.estoqueMinimo ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}>
                          {med.saldoAtual}
                        </span>
                        {med.estoqueMinimo > 0 && (
                          <span className="text-[10px] text-muted-foreground block font-sans">
                            Mín: {med.estoqueMinimo}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAlterarSaldoDireto(med, estado.novoSaldoTotal - 1)}
                            className="h-6 w-6 rounded border border-border bg-background hover:bg-muted font-bold text-xs flex items-center justify-center transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={estado.novoSaldoTotal}
                            onChange={(e) => handleAlterarSaldoDireto(med, parseInt(e.target.value, 10))}
                            className={cn(
                              'w-20 text-center font-mono font-bold py-1 px-2 rounded-lg border text-xs bg-background transition-all',
                              estado.modificado
                                ? 'border-primary ring-2 ring-primary/20 text-primary font-black'
                                : 'border-input text-foreground'
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => handleAlterarSaldoDireto(med, estado.novoSaldoTotal + 1)}
                            className="h-6 w-6 rounded border border-border bg-background hover:bg-muted font-bold text-xs flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono font-bold text-xs">
                        {diferenca === 0 ? (
                          <span className="text-muted-foreground font-medium text-[11px]">—</span>
                        ) : diferenca > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                            +{diferenca}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-black">
                            {diferenca}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setLinhasExpandidas((p) => ({ ...p, [med.id]: !expandido }))}
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors',
                            expandido
                              ? 'bg-muted border-foreground/20 text-foreground'
                              : 'bg-background hover:bg-muted border-border text-muted-foreground'
                          )}
                        >
                          <Layers className="h-3 w-3" />
                          <span>{estado.lotes.length} lote(s)</span>
                          {expandido ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>

                        {/* DRAWER DE LOTES */}
                        {expandido && (
                          <div className="mt-2 p-2.5 bg-background border border-border rounded-lg text-left space-y-2 shadow-inner">
                            <div className="flex items-center justify-between pb-1 border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
                              <span>Detalhamento por Lote</span>
                              <button
                                type="button"
                                onClick={() => handleAdicionarNovoLote(med)}
                                className="text-primary hover:underline flex items-center gap-0.5"
                              >
                                <Plus className="h-3 w-3" /> Adicionar Lote
                              </button>
                            </div>

                            {estado.lotes.map((l, idx) => (
                              <div key={idx} className="grid grid-cols-12 gap-1.5 items-center text-xs">
                                <div className="col-span-5">
                                  <input
                                    type="text"
                                    value={l.lote}
                                    onChange={(e) => {
                                      const novosLotes = [...estado.lotes]
                                      novosLotes[idx] = { ...novosLotes[idx], lote: e.target.value.toUpperCase() }
                                      setAjustes((p) => ({
                                        ...p,
                                        [med.id]: { ...estado, lotes: novosLotes, modificado: true },
                                      }))
                                    }}
                                    placeholder="Nº Lote"
                                    className="w-full border border-input rounded px-1.5 py-0.5 text-[11px] font-mono bg-background"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <input
                                    type="date"
                                    value={l.validade || ''}
                                    onChange={(e) => {
                                      const novosLotes = [...estado.lotes]
                                      novosLotes[idx] = { ...novosLotes[idx], validade: e.target.value }
                                      setAjustes((p) => ({
                                        ...p,
                                        [med.id]: { ...estado, lotes: novosLotes, modificado: true },
                                      }))
                                    }}
                                    className="w-full border border-input rounded px-1.5 py-0.5 text-[11px] bg-background"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <input
                                    type="number"
                                    min={0}
                                    value={l.quantidade}
                                    onChange={(e) => handleAlterarQuantidadeLote(med, idx, parseInt(e.target.value, 10))}
                                    className="w-full border border-input rounded px-1.5 py-0.5 text-[11px] font-mono text-right bg-background"
                                  />
                                </div>
                                <div className="col-span-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoverLote(med, idx)}
                                    className="text-red-500 hover:text-red-700"
                                    title="Remover lote"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {estado.modificado ? (
                          <button
                            type="button"
                            onClick={() => handleDesfazerItem(med.id)}
                            className="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-[10px] font-bold transition-colors"
                            title="Desfazer alterações deste item"
                          >
                            Desfazer
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Sem alterações</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BARRA FLUTUANTE INFERIOR QUANDO HOUVER ITENS MODIFICADOS */}
      {itensModificados.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-card border-2 border-primary/50 shadow-2xl rounded-2xl px-5 py-3 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <strong className="text-foreground">{itensModificados.length}</strong>
            <span className="text-muted-foreground">item(ns) com alterações pendentes</span>
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLimparTodosAjustes}
              className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground font-semibold"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={() => setModalConfirmacaoAberto(true)}
              className="px-5 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90 active:scale-95 flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              Gravar Todos os Ajustes
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO PRÉVIA */}
      {modalConfirmacaoAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Confirmar Gravação de Ajustes</h3>
                <p className="text-xs text-muted-foreground">Resumo da sessão de inventário e movimentações</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-muted/40 p-3 rounded-xl space-y-1.5 border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Motivo Geral:</span>
                  <strong className="text-foreground">{motivoGeral}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Itens Alterados:</span>
                  <strong className="text-foreground">{itensModificados.length} itens</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Itens com Entrada / Acréscimo (+):</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {estatisticasModificados.qtdItensAumento} item(ns) (+{estatisticasModificados.entradasTotal} un)
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Itens com Baixa / Redução (-):</span>
                  <strong className="text-rose-600 dark:text-rose-400">
                    {estatisticasModificados.qtdItensReducao} item(ns) (-{estatisticasModificados.saidasTotal} un)
                  </strong>
                </div>
              </div>

              {observacoesGerais && (
                <p className="text-muted-foreground text-[11px] italic">
                  &quot;{observacoesGerais}&quot;
                </p>
              )}

              <p className="text-muted-foreground text-[11px]">
                Ao confirmar, todos os saldos e lotes serão atualizados atomicamente no banco de dados e lançados no livro-razão de movimentações com sua assinatura de usuário.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setModalConfirmacaoAberto(false)}
                disabled={salvando}
                className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarTodosAjustes}
                disabled={salvando}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg hover:bg-primary/90 active:scale-95"
              >
                {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirmar e Gravar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
