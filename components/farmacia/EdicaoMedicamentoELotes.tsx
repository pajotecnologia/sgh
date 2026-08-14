'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Save,
  Loader2,
  Clock,
  ShieldAlert,
  UserCheck,
  Edit3,
} from 'lucide-react'

type LoteItem = {
  id: string
  lote: string
  validade: string | null
  quantidade: number
}

type SinonimoItem = {
  id: string
  sinonimo: string
}

type MovimentacaoItem = {
  id: string
  tipo: string
  quantidade: number
  saldoAnterior: number
  saldoPosterior: number
  createdAt: string
  observacoes: string | null
  lote?: { lote: string; validade: string | null } | null
}

type MedicamentoDetalhado = {
  id: string
  nome: string
  principioAtivo: string
  codigoEan: string | null
  codigoAnvisa: string | null
  forma: string | null
  concentracao: string | null
  unidade: string | null
  classeTerapeutica: string | null
  viaAdministracao: string | null
  mav: boolean
  duplaChecagem: boolean
  tipoControle: string | null
  alertasAlergia: string | null
  localizacaoFisica: string | null
  temperaturaArmazenamento: string | null
  saldoAtual: number
  saldoReservado: number
  estoqueMinimo: number
  ativo: boolean
  lotes: LoteItem[]
  sinonimos: SinonimoItem[]
  movimentacoes: MovimentacaoItem[]
}

export function EdicaoMedicamentoELotes({ medicamento }: { medicamento: MedicamentoDetalhado }) {
  const router = useRouter()
  const [abaAtiva, setAbaAtiva] = useState<'lotes' | 'dados' | 'historico'>('lotes')
  const [salvando, setSalvando] = useState(false)
  const [salvandoLote, setSalvandoLote] = useState(false)

  // Estados do Form de Dados Master
  const [nome, setNome] = useState(medicamento.nome)
  const [principioAtivo, setPrincipioAtivo] = useState(medicamento.principioAtivo)
  const [codigoEan, setCodigoEan] = useState(medicamento.codigoEan ?? '')
  const [codigoAnvisa, setCodigoAnvisa] = useState(medicamento.codigoAnvisa ?? '')
  const [forma, setForma] = useState(medicamento.forma ?? '')
  const [concentracao, setConcentracao] = useState(medicamento.concentracao ?? '')
  const [unidade, setUnidade] = useState(medicamento.unidade ?? '')
  const [classeTerapeutica, setClasseTerapeutica] = useState(medicamento.classeTerapeutica ?? '')
  const [viaAdministracao, setViaAdministracao] = useState(medicamento.viaAdministracao ?? '')
  const [mav, setMav] = useState(medicamento.mav)
  const [duplaChecagem, setDuplaChecagem] = useState(medicamento.duplaChecagem)
  const [tipoControle, setTipoControle] = useState(medicamento.tipoControle ?? '')
  const [localizacaoFisica, setLocalizacaoFisica] = useState(medicamento.localizacaoFisica ?? '')
  const [temperaturaArmazenamento, setTemperaturaArmazenamento] = useState(medicamento.temperaturaArmazenamento ?? '')
  const [estoqueMinimo, setEstoqueMinimo] = useState(String(medicamento.estoqueMinimo))

  // Estados de Novo / Edição de Lote
  const [novoLote, setNovoLote] = useState('')
  const [novaValidade, setNovaValidade] = useState('')
  const [novaQuantidade, setNovaQuantidade] = useState('')
  const [loteEdicao, setLoteEdicao] = useState<LoteItem | null>(null)

  const handleSalvarDadosMaster = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const res = await fetch(`/api/farmacia/medicamentos/${medicamento.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          principioAtivo: principioAtivo.trim(),
          codigoEan: codigoEan.trim() || null,
          codigoAnvisa: codigoAnvisa.trim() || null,
          forma: forma.trim() || null,
          concentracao: concentracao.trim() || null,
          unidade: unidade.trim() || null,
          classeTerapeutica: classeTerapeutica.trim() || null,
          viaAdministracao: viaAdministracao.trim() || null,
          mav,
          duplaChecagem,
          tipoControle: tipoControle.trim() || null,
          localizacaoFisica: localizacaoFisica.trim() || null,
          temperaturaArmazenamento: temperaturaArmazenamento.trim() || null,
          estoqueMinimo: Number(estoqueMinimo) || 0,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(json?.erro ?? 'Falha ao atualizar medicamento.')
        return
      }
      toast.success('Ficha do medicamento atualizada com sucesso!')
      router.refresh()
    } catch {
      toast.error('Erro de conexão ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const handleSalvarLote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoLote.trim()) {
      toast.error('Informe a identificação do lote.')
      return
    }

    setSalvandoLote(true)
    try {
      const res = await fetch(`/api/farmacia/medicamentos/${medicamento.id}/lotes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lote: novoLote.trim(),
          validade: novaValidade || null,
          quantidade: Number(novaQuantidade) || 0,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(json?.erro ?? 'Falha ao salvar lote.')
        return
      }
      toast.success('Lote e saldo em estoque atualizados!')
      setNovoLote('')
      setNovaValidade('')
      setNovaQuantidade('')
      setLoteEdicao(null)
      router.refresh()
    } catch {
      toast.error('Erro de conexão ao salvar lote.')
    } finally {
      setSalvandoLote(false)
    }
  }

  const prepararEdicaoLote = (l: LoteItem) => {
    setLoteEdicao(l)
    setNovoLote(l.lote)
    setNovaValidade(l.validade ? l.validade.slice(0, 10) : '')
    setNovaQuantidade(String(l.quantidade))
  }

  const cancelarEdicaoLote = () => {
    setLoteEdicao(null)
    setNovoLote('')
    setNovaValidade('')
    setNovaQuantidade('')
  }

  const calcularStatusValidade = (validadeIso: string | null) => {
    if (!validadeIso) return { label: 'Sem validade', badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' }
    const val = new Date(validadeIso)
    const hoje = new Date()
    const diffDias = Math.ceil((val.getTime() - hoje.getTime()) / (1000 * 3600 * 24))

    if (diffDias < 0) {
      return { label: `Vencido (${Math.abs(diffDias)} dias atrás)`, badge: 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' }
    }
    if (diffDias <= 60) {
      return { label: `Vence em ${diffDias} dias`, badge: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' }
    }
    return { label: 'Validade OK', badge: 'bg-green-100 dark:bg-green-950/80 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' }
  }

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Botões de Navegação de Aba */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setAbaAtiva('lotes')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-b-2 ${
            abaAtiva === 'lotes'
              ? 'border-primary text-primary bg-primary/10'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          📦 Lotes e Validades (FEFO)
        </button>
        <button
          type="button"
          onClick={() => setAbaAtiva('dados')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-b-2 ${
            abaAtiva === 'dados'
              ? 'border-primary text-primary bg-primary/10'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          📝 Editar Cadastro do Medicamento
        </button>
        <button
          type="button"
          onClick={() => setAbaAtiva('historico')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-b-2 ${
            abaAtiva === 'historico'
              ? 'border-primary text-primary bg-primary/10'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          📜 Histórico de Movimentações
        </button>
      </div>

      {/* ABA 1: LOTES E VALIDADES */}
      {abaAtiva === 'lotes' ? (
        <div className="space-y-4">
          {/* Tabela dos Lotes Cadastrados */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Lotes Cadastrados no Estoque
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Relação de lotes, datas de validade e saldos atuais alocados para este medicamento.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Saldo Total: <span className="text-green-700 dark:text-green-400 font-mono text-sm">{medicamento.saldoAtual} {medicamento.unidade ?? 'un'}</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Identificação do Lote</th>
                    <th className="px-3 py-3">Data de Validade</th>
                    <th className="px-3 py-3 text-center">Status de Vencimento</th>
                    <th className="px-3 py-3 text-right">Qtde em Estoque</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {medicamento.lotes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                        Nenhum lote registrado ativamente para este medicamento.
                      </td>
                    </tr>
                  ) : (
                    medicamento.lotes.map((l) => {
                      const st = calcularStatusValidade(l.validade)
                      return (
                        <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                            {l.lote}
                          </td>
                          <td className="px-3 py-3 text-slate-700 dark:text-slate-300 font-medium">
                            {l.validade ? (
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                {new Intl.DateTimeFormat('pt-BR').format(new Date(l.validade))}
                              </span>
                            ) : (
                              'Sem validade cadastrada'
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.badge}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            {l.quantidade} {medicamento.unidade ?? 'un'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => prepararEdicaoLote(l)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Editar Lote
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form para Adicionar / Editar Lote */}
          <form onSubmit={handleSalvarLote} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
              {loteEdicao ? <Edit3 className="h-4 w-4 text-amber-500" /> : <Plus className="h-4 w-4 text-primary" />}
              {loteEdicao ? `Editar Lote "${loteEdicao.lote}"` : 'Cadastrar / Ajustar Lote Manualmente'}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Número do Lote *</label>
                <input
                  value={novoLote}
                  onChange={(e) => setNovoLote(e.target.value)}
                  placeholder="Ex.: LOT2026A"
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Data de Validade</label>
                <input
                  type="date"
                  value={novaValidade}
                  onChange={(e) => setNovaValidade(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quantidade no Lote *</label>
                <input
                  type="number"
                  min={0}
                  value={novaQuantidade}
                  onChange={(e) => setNovaQuantidade(e.target.value)}
                  placeholder="Ex.: 500"
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {loteEdicao ? (
                <button
                  type="button"
                  onClick={cancelarEdicaoLote}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar Edição
                </button>
              ) : null}
              <button
                type="submit"
                disabled={salvandoLote}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 py-2 text-xs font-bold hover:brightness-95 disabled:opacity-50"
              >
                {salvandoLote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {loteEdicao ? 'Salvar Alterações do Lote' : 'Adicionar / Salvar Lote'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* ABA 2: EDITAR CADASTRO MASTER DO MEDICAMENTO */}
      {abaAtiva === 'dados' ? (
        <form onSubmit={handleSalvarDadosMaster} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
            Ficha do Medicamento — Dados Principais e Atributos Legais
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nome Comercial *</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Princípio Ativo *</label>
              <input
                value={principioAtivo}
                onChange={(e) => setPrincipioAtivo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
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
                placeholder="Ex.: 7891234567890"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Registro ANVISA</label>
              <input
                value={codigoAnvisa}
                onChange={(e) => setCodigoAnvisa(e.target.value)}
                placeholder="Ex.: 1012345670089"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Forma Farmacêutica</label>
              <input
                value={forma}
                onChange={(e) => setForma(e.target.value)}
                placeholder="Ex.: Solução Injetável"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Concentração</label>
              <input
                value={concentracao}
                onChange={(e) => setConcentracao(e.target.value)}
                placeholder="Ex.: 500 mg/mL"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Unidade de Medida</label>
              <input
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                placeholder="Ex.: AMP, COMP, FR"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Classe Terapêutica</label>
              <input
                value={classeTerapeutica}
                onChange={(e) => setClasseTerapeutica(e.target.value)}
                placeholder="Ex.: Analgésico / Antipirético"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Via de Administração</label>
              <input
                value={viaAdministracao}
                onChange={(e) => setViaAdministracao(e.target.value)}
                placeholder="Ex.: ORAL, INTRAVENOSA"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Localização Física</label>
              <input
                value={localizacaoFisica}
                onChange={(e) => setLocalizacaoFisica(e.target.value)}
                placeholder="Ex.: Prateleira A - Armário 2"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Temperatura Armazenamento</label>
              <input
                value={temperaturaArmazenamento}
                onChange={(e) => setTemperaturaArmazenamento(e.target.value)}
                placeholder="Ex.: 15°C a 30°C ou Refrigerado"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Estoque Mínimo (Alerta)</label>
              <input
                type="number"
                min={0}
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>

          {/* Regras de Segurança */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Controles de Segurança e Protocolos do Paciente (MAV / Dupla Checagem)
            </p>
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
                    <strong>O que significa:</strong> Remédios com elevado risco de causar danos graves ou letais ao paciente em caso de erro (ex.: Insulinas, Opioides, Anticoagulantes, KCl concentrado).
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
                    <strong>O que significa:</strong> Obriga que 2 profissionais de enfermagem distintos façam a conferência independente (Paciente Certo, Dose, Via) antes de aplicar.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-bold hover:brightness-95 disabled:opacity-50"
            >
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Alterações da Ficha
            </button>
          </div>
        </form>
      ) : null}

      {/* ABA 3: HISTÓRICO DE MOVIMENTAÇÕES */}
      {abaAtiva === 'historico' ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              Livro-Razão de Movimentações
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Últimas entradas, dispensações por prescrição e baixas efetuadas.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Data/Hora</th>
                  <th className="px-3 py-3">Tipo de Movimento</th>
                  <th className="px-3 py-3">Lote Vinculado</th>
                  <th className="px-3 py-3 text-center">Qtde</th>
                  <th className="px-3 py-3 text-right">Saldo Anterior ➔ Posterior</th>
                  <th className="px-4 py-3">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {medicamento.movimentacoes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                      Nenhuma movimentação registrada no histórico.
                    </td>
                  </tr>
                ) : (
                  medicamento.movimentacoes.map((m) => {
                    const ePositiva = m.quantidade > 0
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-mono">
                          {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(m.createdAt))}
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-900 dark:text-slate-100">
                          {m.tipo.replace(/_/g, ' ')}
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-800 dark:text-slate-200">
                          {m.lote?.lote ?? '—'}
                        </td>
                        <td className={`px-3 py-3 text-center font-mono font-bold ${ePositiva ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                          {ePositiva ? `+${m.quantidade}` : m.quantidade}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                          {m.saldoAnterior} ➔ <span className="font-bold text-slate-900 dark:text-slate-100">{m.saldoPosterior}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {m.observacoes ?? '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
