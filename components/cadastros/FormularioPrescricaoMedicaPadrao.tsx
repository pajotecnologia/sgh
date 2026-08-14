'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowUp,
  FileText,
  LayoutTemplate,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  Baby,
  Stethoscope,
} from 'lucide-react'
import {
  MODELO_ALA_OBSTETRICA,
  MODELO_ENFERMARIA_GERAL,
} from '@/lib/prescricao-modelo-hospitalar'
import {
  NOME_COLUNA_DIREITA_PADRAO,
  NOME_COLUNA_ESQUERDA_PADRAO,
  type ItemPrescricaoMedicaPadraoForm,
} from '@/lib/validations/prescricao-medica-padrao'
import { cn } from '@/lib/utils'

type PrescricaoMedicaPadraoInicial = {
  id: string
  nome: string
  descricao?: string | null
  observacoesPadrao?: string | null
  nomeColunaEsquerda?: string | null
  nomeColunaDireita?: string | null
  ativo: boolean
  itens: ItemPrescricaoMedicaPadraoForm[]
}

const extrairMensagemErroApi = (json: {
  erro?: string
  detalhes?: Record<string, string[] | undefined>
}) => {
  if (json.detalhes) {
    const primeira = Object.values(json.detalhes).flat().find((msg) => Boolean(msg) && msg !== 'Invalid input')
    if (primeira) return primeira
  }
  if (json.erro && json.erro !== 'Dados inválidos.') return json.erro
  return 'Preencha os campos obrigatórios da prescrição (nome do modelo e texto da coluna esquerda em cada linha).'
}

export function FormularioPrescricaoMedicaPadrao({
  modo,
  prescricaoInicial,
}: {
  modo: 'criar' | 'editar'
  prescricaoInicial?: PrescricaoMedicaPadraoInicial
}) {
  const router = useRouter()

  // Dados Básicos do Modelo
  const [nome, setNome] = useState(prescricaoInicial?.nome ?? '')
  const [descricao, setDescricao] = useState(prescricaoInicial?.descricao ?? '')
  const [observacoesPadrao, setObservacoesPadrao] = useState(prescricaoInicial?.observacoesPadrao ?? '')
  const [nomeColunaEsquerda, setNomeColunaEsquerda] = useState(
    prescricaoInicial?.nomeColunaEsquerda ?? NOME_COLUNA_ESQUERDA_PADRAO
  )
  const [nomeColunaDireita, setNomeColunaDireita] = useState(
    prescricaoInicial?.nomeColunaDireita ?? NOME_COLUNA_DIREITA_PADRAO
  )
  const [ativo, setAtivo] = useState(prescricaoInicial?.ativo ?? true)

  // Grade Interativa de Linhas (Edição In-line)
  const [itensLista, setItensLista] = useState<ItemPrescricaoMedicaPadraoForm[]>(
    prescricaoInicial?.itens?.length
      ? prescricaoInicial.itens
      : [...MODELO_ENFERMARIA_GERAL]
  )

  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!prescricaoInicial) return
    setNome(prescricaoInicial.nome)
    setDescricao(prescricaoInicial.descricao ?? '')
    setObservacoesPadrao(prescricaoInicial.observacoesPadrao ?? '')
    setNomeColunaEsquerda(prescricaoInicial.nomeColunaEsquerda ?? NOME_COLUNA_ESQUERDA_PADRAO)
    setNomeColunaDireita(prescricaoInicial.nomeColunaDireita ?? NOME_COLUNA_DIREITA_PADRAO)
    setAtivo(prescricaoInicial.ativo)
    setItensLista(prescricaoInicial.itens ?? [])
  }, [prescricaoInicial])

  // Manipulação de Linhas na Grade
  const handleAtualizarItem = (index: number, patch: Partial<ItemPrescricaoMedicaPadraoForm>) => {
    setItensLista((lista) =>
      lista.map((it, idx) => {
        if (idx !== index) return it
        return {
          ...it,
          ...patch,
        } as ItemPrescricaoMedicaPadraoForm
      })
    )
  }

  const handleAdicionarLinha = () => {
    const novaLinha: ItemPrescricaoMedicaPadraoForm = {
      tipoItem: 'LINHA_DUPLA',
      nomeMedicamento: '',
      observacoes: '',
      principioAtivo: '',
      dose: '',
      unidadeMedida: '',
      via: '',
      frequencia: '',
    }
    setItensLista((lista) => [...lista, novaLinha])
    toast.info('Nova linha adicionada ao final da lista.')
  }

  const handleRemoverLinha = (index: number) => {
    setItensLista((lista) => lista.filter((_, i) => i !== index))
  }

  const handleMoverLinha = (index: number, direcao: 'up' | 'down') => {
    const destino = direcao === 'up' ? index - 1 : index + 1
    if (destino < 0 || destino >= itensLista.length) return

    setItensLista((lista) => {
      const proxima = [...lista]
      const [item] = proxima.splice(index, 1)
      proxima.splice(destino, 0, item)
      return proxima
    })
  }

  // Presets Rápidos com 1 Clique
  const handleCarregarPresetObstetrica = () => {
    if (itensLista.length > 0 && !window.confirm('Substituir todas as linhas pelo modelo de Ala Obstétrica?')) return
    setNome((prev) => prev.trim() || 'Prescrição Médica Ala Obstétrica - Enfermaria')
    setItensLista(JSON.parse(JSON.stringify(MODELO_ALA_OBSTETRICA)))
    toast.success('Modelo de Ala Obstétrica (Foto 1) carregado com sucesso!')
  }

  const handleCarregarPresetEnfermaria = () => {
    if (itensLista.length > 0 && !window.confirm('Substituir todas as linhas pelo modelo de Enfermaria Geral?')) return
    setNome((prev) => prev.trim() || 'Prescrição Médica - Enfermaria Geral')
    setItensLista(JSON.parse(JSON.stringify(MODELO_ENFERMARIA_GERAL)))
    toast.success('Modelo de Enfermaria Geral (Foto 2) carregado com sucesso!')
  }

  const handleLimparTudo = () => {
    if (!window.confirm('Deseja limpar todas as linhas da lista?')) return
    setItensLista([])
  }

  // Envio / Salvamento
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      toast.error('Informe o nome da prescrição (ex.: Prescrição Ala Obstétrica).')
      return
    }
    if (!nomeColunaEsquerda.trim() || !nomeColunaDireita.trim()) {
      toast.error('Informe os títulos das duas colunas.')
      return
    }

    const itensFiltrados = itensLista.filter(
      (it) => it.nomeMedicamento.trim().length > 0 || (it.observacoes ?? '').trim().length > 0
    )

    if (itensFiltrados.length === 0) {
      toast.error('Adicione ao menos 1 linha com texto na prescrição.')
      return
    }

    const indexSemNome = itensFiltrados.findIndex((it) => !it.nomeMedicamento.trim())
    if (indexSemNome !== -1) {
      toast.error(`A linha ${indexSemNome + 1} está com a coluna esquerda em branco. Preencha o texto ou remova a linha.`)
      return
    }

    setSalvando(true)
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        observacoesPadrao: observacoesPadrao.trim() || null,
        nomeColunaEsquerda: nomeColunaEsquerda.trim(),
        nomeColunaDireita: nomeColunaDireita.trim(),
        ativo,
        itens: itensFiltrados,
      }

      const url =
        modo === 'criar'
          ? '/api/cadastros/prescricoes-medicas'
          : `/api/cadastros/prescricoes-medicas/${prescricaoInicial?.id}`
      const method = modo === 'criar' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(extrairMensagemErroApi(json))
        return
      }
      toast.success('Modelo de prescrição padrão salvo com sucesso!')
      router.push('/cadastros/prescricoes-medicas')
      router.refresh()
    } catch {
      toast.error('Erro de conexão com o servidor.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSalvar} className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Dados Básicos do Modelo */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary shrink-0" aria-hidden />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {modo === 'criar' ? 'Novo Modelo de Prescrição Médica' : `Editar: ${nome}`}
            </h2>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            Modelo Ativo
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome da Prescrição / Setor *
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Prescrição Médica Ala Obstétrica - Enfermaria"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição / Finalidade (Opcional)
            </label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Modelo padrão com dietas, hidratação e medicações de suporte da enfermaria"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título da Coluna Esquerda *
            </label>
            <input
              value={nomeColunaEsquerda}
              onChange={(e) => setNomeColunaEsquerda(e.target.value)}
              placeholder="MEDICAÇÕES / ORIENTAÇÕES"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3.5 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título da Coluna Direita *
            </label>
            <input
              value={nomeColunaDireita}
              onChange={(e) => setNomeColunaDireita(e.target.value)}
              placeholder="HORÁRIOS / FREQUÊNCIA"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3.5 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>
        </div>
      </div>

      {/* 2. Modelos Prontos em 1 Clique */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Modelos Hospitalares Prontos (Preenchimento Rápido com 1 Clique)
          </h3>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleCarregarPresetObstetrica}
            className="inline-flex items-center gap-2 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/40 px-3.5 py-2 text-xs font-bold text-purple-900 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors shadow-sm"
          >
            <Baby className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Carregar Prescrição Ala Obstétrica (Foto 1)
          </button>

          <button
            type="button"
            onClick={handleCarregarPresetEnfermaria}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 px-3.5 py-2 text-xs font-bold text-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shadow-sm"
          >
            <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Carregar Prescrição Enfermaria Geral (Foto 2)
          </button>

          {itensLista.length > 0 ? (
            <button
              type="button"
              onClick={handleLimparTudo}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar todas as linhas
            </button>
          ) : null}
        </div>
      </div>

      {/* 3. Tabela de Edição Direta em Grade (In-Line Editor) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-0">
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Grade da Prescrição ({itensLista.length} linhas)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Edite o texto diretamente em cada célula da tabela.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th scope="col" className="p-3 w-12 text-center">#</th>
                <th scope="col" className="p-3 w-[62%]">
                  {nomeColunaEsquerda || 'MEDICAÇÕES / ORIENTAÇÕES (LADO ESQUERDO)'}
                </th>
                <th scope="col" className="p-3 w-[28%]">
                  {nomeColunaDireita || 'HORÁRIOS / FREQUÊNCIA (LADO DIREITO)'}
                </th>
                <th scope="col" className="p-3 w-20 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {itensLista.map((linha, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors align-top">
                  <td className="p-3 text-center text-xs font-mono font-bold text-slate-400 pt-4">
                    {idx + 1}
                  </td>
                  <td className="p-2">
                    <textarea
                      value={linha.nomeMedicamento}
                      onChange={(e) => handleAtualizarItem(idx, { nomeMedicamento: e.target.value })}
                      placeholder="Ex.: DIPIRONA 500MG/ML - 02 AMP + AD, EV 6/6H S/N"
                      rows={Math.max(1, Math.ceil(linha.nomeMedicamento.length / 50))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/30 resize-y min-h-[2.5rem]"
                      aria-label={`Linha ${idx + 1} Coluna Esquerda`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={linha.observacoes ?? ''}
                      onChange={(e) => handleAtualizarItem(idx, { observacoes: e.target.value })}
                      placeholder="Ex.: 6/6H SN, 24/24H"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-xs font-mono font-semibold outline-none focus:ring-2 focus:ring-primary/30"
                      aria-label={`Linha ${idx + 1} Horários`}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => handleMoverLinha(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 text-slate-400 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-20 transition-colors"
                        title="Mover para cima"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoverLinha(idx, 'down')}
                        disabled={idx === itensLista.length - 1}
                        className="p-1.5 text-slate-400 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-20 transition-colors"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoverLinha(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Excluir esta linha"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {itensLista.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Nenhuma linha adicionada. Clique nos modelos prontos acima ou no botão abaixo para incluir linhas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex justify-start">
          <button
            type="button"
            onClick={handleAdicionarLinha}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-slate-100 dark:text-slate-900 px-4 py-2.5 text-xs font-bold hover:brightness-110 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            + Adicionar Nova Linha na Prescrição
          </button>
        </div>
      </div>

      {/* 4. Botão Salvar */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={salvando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-6 py-3 text-sm font-bold shadow-md hover:brightness-95 disabled:opacity-50 transition-all"
        >
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Salvar Modelo de Prescrição Padrão
        </button>
      </div>
    </form>
  )
}
