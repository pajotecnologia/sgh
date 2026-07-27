'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowUp,
  FileText,
  LayoutTemplate,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { FormularioDinamico } from '@/components/shared/FormularioDinamico'
import { TabelaDuasColunasPrescricaoModelo } from '@/components/prescricao/TabelaDuasColunasPrescricaoModelo'
import { CAMPOS_MODELO_PRESCRICAO_MEDICA } from '@/lib/cadastros/config-formulario-prescricao-medica'
import {
  colunasPrescricaoFromModelo,
  linhasDuasColunasFromItensModelo,
} from '@/lib/prescricao-modelo-colunas'
import { ITENS_MODELO_HOSPITALAR_PADRAO } from '@/lib/prescricao-modelo-hospitalar'
import {
  NOME_COLUNA_DIREITA_PADRAO,
  NOME_COLUNA_ESQUERDA_PADRAO,
  schemaItemPrescricaoMedicaPadraoLinhaDupla,
  type ItemPrescricaoMedicaPadraoForm,
} from '@/lib/validations/prescricao-medica-padrao'
import { cn } from '@/lib/utils'

const extrairMensagemErroApi = (json: {
  erro?: string
  detalhes?: Record<string, string[] | undefined>
}) => {
  if (json.detalhes) {
    const primeira = Object.values(json.detalhes).flat().find(Boolean)
    if (primeira) return primeira
  }
  return json.erro ?? 'Falha ao salvar prescrição padrão.'
}

const normalizarItensParaSalvar = (itens: ItemPrescricaoMedicaPadraoForm[]) => itens

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

const valoresModeloIniciais = (p?: PrescricaoMedicaPadraoInicial): Record<string, string> => ({
  nome: p?.nome ?? '',
  descricao: p?.descricao ?? '',
  observacoesPadrao: p?.observacoesPadrao ?? '',
  nomeColunaEsquerda: p?.nomeColunaEsquerda ?? NOME_COLUNA_ESQUERDA_PADRAO,
  nomeColunaDireita: p?.nomeColunaDireita ?? NOME_COLUNA_DIREITA_PADRAO,
})

export function FormularioPrescricaoMedicaPadrao({
  modo,
  prescricaoInicial,
}: {
  modo: 'criar' | 'editar'
  prescricaoInicial?: PrescricaoMedicaPadraoInicial
}) {
  const router = useRouter()
  const [dadosModelo, setDadosModelo] = useState<Record<string, string>>(() =>
    valoresModeloIniciais(prescricaoInicial)
  )
  const [modeloFormKey, setModeloFormKey] = useState(0)
  const [ativo, setAtivo] = useState(prescricaoInicial?.ativo ?? true)
  const [itensLista, setItensLista] = useState<ItemPrescricaoMedicaPadraoForm[]>(
    prescricaoInicial?.itens ?? []
  )
  const [textoEsquerdaDraft, setTextoEsquerdaDraft] = useState('')
  const [textoDireitaDraft, setTextoDireitaDraft] = useState('')
  const [editandoIndice, setEditandoIndice] = useState<number | null>(null)
  const [salvando, setSalvando] = useState(false)

  const valoresIniciaisModelo = useMemo(
    () => valoresModeloIniciais(prescricaoInicial),
    [prescricaoInicial, modeloFormKey]
  )

  const colunas = useMemo(
    () =>
      colunasPrescricaoFromModelo({
        nomeColunaEsquerda: dadosModelo.nomeColunaEsquerda,
        nomeColunaDireita: dadosModelo.nomeColunaDireita,
      }),
    [dadosModelo.nomeColunaEsquerda, dadosModelo.nomeColunaDireita]
  )

  const linhasDuasColunas = useMemo(
    () => linhasDuasColunasFromItensModelo(itensLista),
    [itensLista]
  )

  useEffect(() => {
    if (!prescricaoInicial) return
    setDadosModelo(valoresModeloIniciais(prescricaoInicial))
    setAtivo(prescricaoInicial.ativo)
    setItensLista(prescricaoInicial.itens)
    setModeloFormKey((k) => k + 1)
  }, [prescricaoInicial])

  const resetarFormularioLinha = () => {
    setEditandoIndice(null)
    setTextoEsquerdaDraft('')
    setTextoDireitaDraft('')
  }

  const handleIncluirLinha = () => {
    const rascunho: ItemPrescricaoMedicaPadraoForm = {
      tipoItem: 'LINHA_DUPLA',
      nomeMedicamento: textoEsquerdaDraft.trim(),
      observacoes: textoDireitaDraft.trim(),
      principioAtivo: '',
      dose: '',
      unidadeMedida: '',
      via: '',
      frequencia: '',
    }
    const parsed = schemaItemPrescricaoMedicaPadraoLinhaDupla.safeParse(rascunho)

    if (!parsed.success) {
      const primeira = parsed.error.issues[0]?.message ?? 'Informe o texto da coluna esquerda.'
      toast.error(primeira)
      return
    }

    const item = parsed.data

    if (editandoIndice !== null) {
      setItensLista((lista) => lista.map((i, idx) => (idx === editandoIndice ? item : i)))
      toast.success('Linha atualizada.')
    } else {
      setItensLista((lista) => [...lista, item])
      toast.success('Linha incluída no modelo.')
    }

    resetarFormularioLinha()
  }

  const handleEditarItem = (index: number) => {
    const item = itensLista[index]
    if (!item || item.tipoItem !== 'LINHA_DUPLA') return
    setEditandoIndice(index)
    setTextoEsquerdaDraft(item.nomeMedicamento)
    setTextoDireitaDraft(item.observacoes ?? '')
  }

  const handleRemoverItem = (index: number) => {
    setItensLista((lista) => lista.filter((_, i) => i !== index))
    if (editandoIndice === index) {
      resetarFormularioLinha()
    } else if (editandoIndice !== null && index < editandoIndice) {
      setEditandoIndice((i) => (i !== null ? i - 1 : null))
    }
  }

  const ajustarIndiceEdicaoAoMover = (de: number, para: number, editando: number | null) => {
    if (editando === null) return null
    if (editando === de) return para
    if (de < para && editando > de && editando <= para) return editando - 1
    if (de > para && editando >= para && editando < de) return editando + 1
    return editando
  }

  const handleMoverItem = (index: number, direcao: 'up' | 'down') => {
    const destino = direcao === 'up' ? index - 1 : index + 1
    if (destino < 0 || destino >= itensLista.length) return

    setItensLista((lista) => {
      const proxima = [...lista]
      const [item] = proxima.splice(index, 1)
      proxima.splice(destino, 0, item)
      return proxima
    })
    setEditandoIndice((atual) => ajustarIndiceEdicaoAoMover(index, destino, atual))
  }

  const handleCarregarModeloHospitalar = () => {
    if (itensLista.length > 0) {
      const confirmar = window.confirm(
        'Isso substituirá todas as linhas atuais pelo modelo hospitalar padrão. Continuar?'
      )
      if (!confirmar) return
    }
    setItensLista([...ITENS_MODELO_HOSPITALAR_PADRAO])
    resetarFormularioLinha()
    toast.success('Modelo hospitalar carregado. Ajuste os textos se necessário.')
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dadosModelo.nome?.trim()) {
      toast.error('Informe o nome da prescrição.')
      return
    }
    if (!dadosModelo.nomeColunaEsquerda?.trim() || !dadosModelo.nomeColunaDireita?.trim()) {
      toast.error('Informe os nomes das duas colunas.')
      return
    }
    if (itensLista.length === 0) {
      toast.error('Inclua pelo menos uma linha no modelo.')
      return
    }

    setSalvando(true)
    try {
      const payload = {
        nome: dadosModelo.nome.trim(),
        descricao: dadosModelo.descricao?.trim() ?? '',
        observacoesPadrao: dadosModelo.observacoesPadrao?.trim() ?? '',
        nomeColunaEsquerda: dadosModelo.nomeColunaEsquerda.trim(),
        nomeColunaDireita: dadosModelo.nomeColunaDireita.trim(),
        ativo,
        itens: normalizarItensParaSalvar(itensLista),
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
      toast.success('Prescrição padrão salva.')
      router.push('/cadastros/prescricoes-medicas')
      router.refresh()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSalvar} className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" aria-hidden />
            Dados do modelo
          </h3>
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
              aria-label="Prescrição ativa"
            />
            Prescrição ativa
          </label>
        </div>

        <FormularioDinamico
          key={`modelo-${modeloFormKey}`}
          formKey={modeloFormKey}
          prefixoId="modelo-prescricao"
          campos={CAMPOS_MODELO_PRESCRICAO_MEDICA}
          valoresIniciais={valoresIniciaisModelo}
          onValoresChange={setDadosModelo}
          ocultarBotaoEnviar
          ocultarDicasLayout
          semWrapperForm
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
          <div>
            <label htmlFor="nome-coluna-esquerda" className="block text-sm font-medium text-muted-foreground mb-1.5">
              Nome da coluna esquerda <span className="text-destructive">*</span>
            </label>
            <input
              id="nome-coluna-esquerda"
              value={dadosModelo.nomeColunaEsquerda ?? ''}
              onChange={(e) => setDadosModelo((d) => ({ ...d, nomeColunaEsquerda: e.target.value }))}
              placeholder={NOME_COLUNA_ESQUERDA_PADRAO}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              aria-label="Nome da coluna esquerda"
            />
          </div>
          <div>
            <label htmlFor="nome-coluna-direita" className="block text-sm font-medium text-muted-foreground mb-1.5">
              Nome da coluna direita <span className="text-destructive">*</span>
            </label>
            <input
              id="nome-coluna-direita"
              value={dadosModelo.nomeColunaDireita ?? ''}
              onChange={(e) => setDadosModelo((d) => ({ ...d, nomeColunaDireita: e.target.value }))}
              placeholder={NOME_COLUNA_DIREITA_PADRAO}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              aria-label="Nome da coluna direita"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-primary/25 bg-primary/[0.03] p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-foreground">
            {editandoIndice !== null ? `Editar linha #${editandoIndice + 1}` : 'Adicionar linha ao modelo'}
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCarregarModeloHospitalar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold hover:bg-muted/50 transition-colors"
            >
              <LayoutTemplate className="h-3.5 w-3.5" aria-hidden />
              Carregar modelo hospitalar
            </button>
            {editandoIndice !== null ? (
              <button
                type="button"
                onClick={resetarFormularioLinha}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Cancelar edição
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <div className="space-y-2 rounded-lg border border-primary/20 bg-background p-4">
            <label htmlFor="texto-coluna-esquerda" className="block text-sm font-medium text-primary">
              {colunas.nomeColunaEsquerda} <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Texto fixo cadastrado (ex.: Dieta, Monitorização, Medicação sintomática…).
            </p>
            <textarea
              id="texto-coluna-esquerda"
              rows={3}
              value={textoEsquerdaDraft}
              onChange={(e) => setTextoEsquerdaDraft(e.target.value)}
              placeholder="Ex.: Dieta, Oxigenoterapia, Medicação intravenosa contínua…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y min-h-[5rem]"
              aria-label="Texto da coluna esquerda"
            />
          </div>

          <div className="space-y-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 p-4">
            <label htmlFor="texto-coluna-direita" className="block text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {colunas.nomeColunaDireita} <span className="text-muted-foreground font-normal">(opcional no cadastro)</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Sugestão ou exemplo de preenchimento. Na prescrição, o médico preenche esta coluna.
            </p>
            <textarea
              id="texto-coluna-direita"
              rows={3}
              value={textoDireitaDraft}
              onChange={(e) => setTextoDireitaDraft(e.target.value)}
              placeholder="Ex.: Dieta zero VO, O₂ 2 L/min cateter nasal… (deixe vazio se preferir)"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-y min-h-[5rem]"
              aria-label="Texto opcional da coluna direita"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleIncluirLinha}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {editandoIndice !== null ? 'Atualizar linha' : 'Incluir linha'}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h5 className="text-sm font-bold text-foreground">
            Pré-visualização do formulário
            <span className="ml-2 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {itensLista.length} {itensLista.length === 1 ? 'linha' : 'linhas'}
            </span>
          </h5>
        </div>

        {itensLista.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
            Nenhuma linha incluída. Adicione manualmente ou use &quot;Carregar modelo hospitalar&quot;.
          </p>
        ) : (
          <TabelaDuasColunasPrescricaoModelo
            linhas={linhasDuasColunas}
            colunas={colunas}
            modo="cadastro"
            renderAcoes={(index) => (
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMoverItem(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded disabled:opacity-25 disabled:pointer-events-none transition-colors"
                  aria-label={`Mover linha ${index + 1} para cima`}
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoverItem(index, 'down')}
                  disabled={index === itensLista.length - 1}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded disabled:opacity-25 disabled:pointer-events-none transition-colors"
                  aria-label={`Mover linha ${index + 1} para baixo`}
                >
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => handleEditarItem(index)}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    editandoIndice === index
                      ? 'text-primary bg-primary/10'
                      : 'text-primary hover:bg-primary/10'
                  )}
                  aria-label={`Editar linha ${index + 1}`}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoverItem(index)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  aria-label={`Remover linha ${index + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            )}
          />
        )}
      </div>

      <div className="flex justify-start">
        <button
          type="submit"
          disabled={salvando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Salvar prescrição padrão
        </button>
      </div>
    </form>
  )
}
