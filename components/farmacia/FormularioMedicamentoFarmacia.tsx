'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Loader2,
  ShieldAlert,
  UserCheck,
  Search,
  Sparkles,
  Pill,
  Syringe,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
} from 'lucide-react'
import type { ItemCatalogo } from '@/app/api/farmacia/medicamentos/busca-catalogo/route'

export function FormularioMedicamentoFarmacia() {
  const router = useRouter()
  
  // Tipo de cadastro: MEDICAMENTO ou MATERIAL
  const [categoria, setCategoria] = useState<'MEDICAMENTO' | 'MATERIAL'>('MEDICAMENTO')
  
  // Ativação da Busca no Catálogo
  const [modoBuscaAtivo, setModoBuscaAtivo] = useState(true)
  const [termoBusca, setTermoBusca] = useState('')
  const [buscandoCatalogo, setBuscandoCatalogo] = useState(false)
  const [resultadosCatalogo, setResultadosCatalogo] = useState<ItemCatalogo[]>([])
  const [itemSelecionado, setItemSelecionado] = useState<ItemCatalogo | null>(null)

  // Campos do Formulário
  const [nome, setNome] = useState('')
  const [principioAtivo, setPrincipioAtivo] = useState('')
  const [codigoEan, setCodigoEan] = useState('')
  const [codigoAnvisa, setCodigoAnvisa] = useState('')
  const [forma, setForma] = useState('')
  const [concentracao, setConcentracao] = useState('')
  const [unidade, setUnidade] = useState('')
  const [classeTerapeutica, setClasseTerapeutica] = useState('')
  const [viaAdministracao, setViaAdministracao] = useState('')
  const [mav, setMav] = useState(false)
  const [duplaChecagem, setDuplaChecagem] = useState(false)
  const [tipoControle, setTipoControle] = useState('')
  const [saldoAtual, setSaldoAtual] = useState('0')
  const [estoqueMinimo, setEstoqueMinimo] = useState('0')
  const [salvando, setSalvando] = useState(false)

  // Carrega configuração de busca da instituição
  useEffect(() => {
    async function checarConfig() {
      try {
        const res = await fetch('/api/configuracoes/instituicao')
        const json = await res.json()
        if (json.sucesso && json.dados) {
          setModoBuscaAtivo(json.dados.buscaAutomaticaCatalogo !== false)
        }
      } catch {
        // silencioso
      }
    }
    checarConfig()
  }, [])

  // Debounce para busca no catálogo
  useEffect(() => {
    if (!modoBuscaAtivo || !termoBusca.trim() || termoBusca.trim().length < 2) {
      setResultadosCatalogo([])
      return
    }

    const timer = setTimeout(async () => {
      setBuscandoCatalogo(true)
      try {
        const catQuery = categoria === 'MEDICAMENTO' ? 'medicamento' : 'material'
        const res = await fetch(
          `/api/farmacia/medicamentos/busca-catalogo?q=${encodeURIComponent(termoBusca.trim())}&categoria=${catQuery}`
        )
        const json = await res.json()
        if (json.sucesso && Array.isArray(json.itens)) {
          setResultadosCatalogo(json.itens)
        }
      } catch {
        // silencioso
      } finally {
        setBuscandoCatalogo(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [termoBusca, modoBuscaAtivo, categoria])

  const selecionarItemCatalogo = (item: ItemCatalogo) => {
    setItemSelecionado(item)
    setNome(item.nome)
    setPrincipioAtivo(item.principioAtivo)
    setCodigoEan(item.codigoEan || '')
    setCodigoAnvisa(item.codigoAnvisa || '')
    setForma(item.forma || '')
    setConcentracao(item.concentracao || '')
    setUnidade(item.unidade || '')
    setClasseTerapeutica(item.classeTerapeutica || '')
    setViaAdministracao(item.viaAdministracao || '')
    setMav(Boolean(item.mav))
    setDuplaChecagem(Boolean(item.duplaChecagem))
    setTipoControle(item.tipoControle || '')
    setResultadosCatalogo([])
    setTermoBusca('')
    toast.success(`Campos autopreenchidos com base em: "${item.nome}"`)
  }

  const limparSelecaoCatalogo = () => {
    setItemSelecionado(null)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      toast.error('Informe o nome comercial ou do material.')
      return
    }

    setSalvando(true)
    try {
      // Se for material e principioAtivo estiver em branco, usa o nome do material
      const paFinal = principioAtivo.trim() || nome.trim() || 'Material Hospitalar'

      const res = await fetch('/api/farmacia/medicamentos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          principioAtivo: paFinal,
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
          saldoAtual: Number.isFinite(Number(saldoAtual)) ? Math.max(0, Number(saldoAtual)) : 0,
          estoqueMinimo: Number.isFinite(Number(estoqueMinimo)) ? Math.max(0, Number(estoqueMinimo)) : 0,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(json?.erro ?? 'Falha ao salvar item no catálogo.')
        return
      }
      toast.success(
        categoria === 'MEDICAMENTO'
          ? 'Medicamento cadastrado com sucesso!'
          : 'Material Hospitalar cadastrado com sucesso!'
      )
      router.push(`/cadastros/medicamentos/${json.dados.id}`)
      router.refresh()
    } catch {
      toast.error('Erro de conexão com o servidor.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSalvar} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5 shadow-sm">
      {/* Seleção de Categoria: Medicamento vs Material */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCategoria('MEDICAMENTO')
              setItemSelecionado(null)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              categoria === 'MEDICAMENTO'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Pill className="h-4 w-4" />
            Medicamento (Fármaco)
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoria('MATERIAL')
              setItemSelecionado(null)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              categoria === 'MATERIAL'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Syringe className="h-4 w-4" />
            Material / Insumo Hospitalar
          </button>
        </div>

        {/* Chave para alternar busca automática vs manual no próprio formulário */}
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer self-end sm:self-auto">
          <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
          <span>Busca Automática:</span>
          <input
            type="checkbox"
            checked={modoBuscaAtivo}
            onChange={(e) => setModoBuscaAtivo(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-700 text-primary"
          />
          <span className={modoBuscaAtivo ? 'text-primary font-bold' : 'text-slate-500'}>
            {modoBuscaAtivo ? 'Ativada (ANVISA/CATMAT)' : 'Modo Manual'}
          </span>
        </label>
      </div>

      {/* Pesquisa no Catálogo da ANVISA / CATMAT */}
      {modoBuscaAtivo && (
        <div className="relative p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Busca Inteligente no Catálogo (ANVISA / CATMAT / TUSS)
            </label>
            {itemSelecionado && (
              <span className="text-[11px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Autopreenchido
              </span>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder={
                categoria === 'MEDICAMENTO'
                  ? 'Digite o nome do medicamento, princípio ativo ou código EAN (ex.: Dipirona, Novalgina, Insulina)...'
                  : 'Digite o nome do material hospitalar (ex.: Seringa 5ml, Gaze, Cateter 18G, Luva, Equipo)...'
              }
              className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            {buscandoCatalogo && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-primary" />
            )}
          </div>

          {/* Lista de Resultados Encontrados */}
          {resultadosCatalogo.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {resultadosCatalogo.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => selecionarItemCatalogo(item)}
                  className="w-full text-left p-3 hover:bg-primary/5 dark:hover:bg-slate-800/60 transition-colors flex items-start justify-between gap-3 group"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary">
                      {item.nome}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.principioAtivo} • {item.forma || '—'} {item.concentracao ? `(${item.concentracao})` : ''}
                    </p>
                    {item.classeTerapeutica && (
                      <span className="inline-block text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        Categoria: {item.classeTerapeutica}
                      </span>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
                      {item.unidade || 'UN'}
                    </span>
                    {item.codigoAnvisa && (
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        MS: {item.codigoAnvisa}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {itemSelecionado && (
            <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40 mt-2">
              <span>
                <strong>Item do Catálogo Selecionado:</strong> {itemSelecionado.nome} ({itemSelecionado.principioAtivo}) — Os campos abaixo podem ser editados livremente.
              </span>
              <button
                type="button"
                onClick={limparSelecaoCatalogo}
                className="text-slate-400 hover:text-red-500 p-1"
                title="Limpar seleção do catálogo"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Formulário Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {categoria === 'MEDICAMENTO' ? 'Nome Comercial / Medicamento *' : 'Descrição / Nome do Material *'}
          </label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            placeholder={
              categoria === 'MEDICAMENTO' ? 'Ex.: Novalgina' : 'Ex.: Seringa Descartável 5mL Luer Lock'
            }
            aria-label="Nome do medicamento ou material"
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {categoria === 'MEDICAMENTO' ? 'Princípio Ativo *' : 'Especificação Técnica / Componente Principal'}
          </label>
          <input
            value={principioAtivo}
            onChange={(e) => setPrincipioAtivo(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            placeholder={
              categoria === 'MEDICAMENTO' ? 'Ex.: Dipirona Monoidratada' : 'Ex.: Polipropileno / Seringa Luer Lock'
            }
            aria-label="Princípio ativo ou especificação"
            required={categoria === 'MEDICAMENTO'}
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
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Registro ANVISA / MS</label>
          <input
            value={codigoAnvisa}
            onChange={(e) => setCodigoAnvisa(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm font-mono"
            placeholder="Ex.: 1012345670089 ou 80123450001"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {categoria === 'MEDICAMENTO' ? 'Forma Farmacêutica' : 'Apresentação / Embalagem'}
          </label>
          <input
            value={forma}
            onChange={(e) => setForma(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
            placeholder={categoria === 'MEDICAMENTO' ? 'Ex.: Solução Injetável' : 'Ex.: Caixas c/ 100 un'}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {categoria === 'MEDICAMENTO' ? 'Concentração' : 'Dimensão / Calibre'}
          </label>
          <input
            value={concentracao}
            onChange={(e) => setConcentracao(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
            placeholder={categoria === 'MEDICAMENTO' ? 'Ex.: 500 mg/mL' : 'Ex.: 5 mL / 18G'}
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
            placeholder={categoria === 'MEDICAMENTO' ? 'Ex.: AMP, COMP, FR' : 'Ex.: UN, CX, PCT, RL'}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {categoria === 'MEDICAMENTO' ? 'Tipo de Controle (Portaria 344)' : 'Categoria de Material'}
          </label>
          <input
            value={tipoControle}
            onChange={(e) => setTipoControle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-sm"
            placeholder={
              categoria === 'MEDICAMENTO'
                ? 'Ex.: A1, B1, C1 (Isento se em branco)'
                : 'Ex.: Insumo / Acesso Venoso'
            }
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

      {/* Regras e Alertas de Segurança (Apenas para Medicamentos) */}
      {categoria === 'MEDICAMENTO' && (
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
      )}

      {/* Saldo Inicial e Envio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center pt-2 border-t border-slate-200 dark:border-slate-800">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Saldo Inicial em Estoque</label>
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
          {categoria === 'MEDICAMENTO' ? 'Cadastrar Medicamento' : 'Cadastrar Material Hospitalar'}
        </button>
      </div>
    </form>
  )
}
