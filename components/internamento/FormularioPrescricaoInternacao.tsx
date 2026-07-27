'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertOctagon,
  AlertTriangle,
  FileSignature,
  ListPlus,
  Loader2,
  Pencil,
  Pill,
  Trash2,
} from 'lucide-react'
import { ModalInteracaoCritica, type InteracaoCritica } from '@/components/farmacia/ModalInteracaoCritica'
import { ModalPrescricaoDuplicada, type PrescricaoDuplicada } from '@/components/prescricao/ModalPrescricaoDuplicada'
import { TabelaDuasColunasPrescricaoModelo } from '@/components/prescricao/TabelaDuasColunasPrescricaoModelo'
import {
  formatarDosePrescricao,
  FREQUENCIAS_RAPIDAS,
  labelVia,
  UNIDADES_MEDIDA,
  VIAS_ADMINISTRACAO,
} from '@/lib/prescricao-ui'
import { linhasDuasColunasModeloEMedico } from '@/lib/prescricao-modelo-colunas'
import type { ColunasPrescricaoModelo } from '@/lib/prescricao-modelo-colunas'
import { isLinhaDuplaPrescricao } from '@/lib/prescricao-medica-padrao-map'
import { schemaItemPrescricaoInternacao, type CriarPrescricaoForm } from '@/lib/validations/atendimento'
import { cn } from '@/lib/utils'

type ItemPrescricao = CriarPrescricaoForm['itens'][number]

const itemVazio = (): ItemPrescricao => ({
  nomeMedicamento: '',
  principioAtivo: '',
  dose: '',
  unidadeMedida: '',
  via: 'ORAL',
  frequencia: '',
  quantidadeSolicitada: 1,
  duracaoDias: undefined,
  observacoes: '',
})

type FormularioPrescricaoInternacaoProps = {
  atendimentoId: string
  prontuarioId: string
  prefillItens?: ItemPrescricao[]
  prefillObservacoes?: string
  referenciaModeloItens?: ItemPrescricao[]
  colunasModelo?: ColunasPrescricaoModelo
  onPrescricaoCriada?: () => void
}

export function FormularioPrescricaoInternacao({
  atendimentoId,
  prontuarioId,
  prefillItens,
  prefillObservacoes,
  referenciaModeloItens,
  colunasModelo,
  onPrescricaoCriada,
}: FormularioPrescricaoInternacaoProps) {
  const [itemDraft, setItemDraft] = useState<ItemPrescricao>(itemVazio)
  const [itensLista, setItensLista] = useState<ItemPrescricao[]>(() =>
    prefillItens !== undefined ? [...prefillItens] : []
  )
  const [editandoIndice, setEditandoIndice] = useState<number | null>(null)
  const [errosDraft, setErrosDraft] = useState<Record<string, string>>({})
  const [observacoes, setObservacoes] = useState(() => prefillObservacoes ?? '')
  const [enviando, setEnviando] = useState(false)

  const isModoLinhaDupla = useMemo(
    () => Boolean(referenciaModeloItens?.some((item) => isLinhaDuplaPrescricao(item))),
    [referenciaModeloItens]
  )

  const exibirDuasColunas = isModoLinhaDupla && Boolean(referenciaModeloItens?.length && itensLista.length > 0)

  const linhasPrescricao = useMemo(() => {
    if (!referenciaModeloItens?.length || !itensLista.length) return []
    return linhasDuasColunasModeloEMedico(referenciaModeloItens, itensLista)
  }, [referenciaModeloItens, itensLista])

  const [alertas, setAlertas] = useState<{
    alergias?: { medicamento: string; alergias: string[] }[]
    interacoes?: { medicamento1: string; medicamento2: string; gravidade: string; descricao: string }[]
    bloqueado: boolean
  } | null>(null)

  const [modalCritico, setModalCritico] = useState<{
    aberto: boolean
    itemNovo: { nomeMedicamento: string; principioAtivo?: string }
    interacoes: InteracaoCritica[]
    payload: { observacoes: string; itens: ItemPrescricao[]; justificativaMedicaCritica?: string } | null
  }>({ aberto: false, itemNovo: { nomeMedicamento: '' }, interacoes: [], payload: null })

  const [modalDuplicada, setModalDuplicada] = useState<{
    aberto: boolean
    duplicada: PrescricaoDuplicada | null
    payload: { observacoes: string; itens: ItemPrescricao[]; justificativaMedicaCritica?: string } | null
  }>({ aberto: false, duplicada: null, payload: null })

  useEffect(() => {
    if (prefillItens === undefined) return
    setItensLista([...prefillItens])
    setItemDraft(itemVazio())
    setEditandoIndice(null)
    setErrosDraft({})
  }, [prefillItens])

  useEffect(() => {
    if (prefillObservacoes === undefined) return
    setObservacoes(prefillObservacoes)
  }, [prefillObservacoes])

  const inputClass = (campo?: string) =>
    cn(
      'w-full px-3 py-2 text-sm border rounded-md bg-background outline-none transition-all',
      'focus:ring-2 focus:ring-primary/30 focus:border-primary',
      campo && errosDraft[campo] ? 'border-destructive' : 'border-input'
    )

  const atualizarDraft = <K extends keyof ItemPrescricao>(campo: K, valor: ItemPrescricao[K]) => {
    setItemDraft((atual) => ({ ...atual, [campo]: valor }))
    if (errosDraft[campo as string]) {
      setErrosDraft((atual) => {
        const next = { ...atual }
        delete next[campo as string]
        return next
      })
    }
  }

  const validarDraft = (): ItemPrescricao | null => {
    const parsed = schemaItemPrescricaoInternacao.safeParse({
      ...itemDraft,
      nomeMedicamento: itemDraft.nomeMedicamento.trim(),
      principioAtivo: itemDraft.principioAtivo?.trim() ?? '',
      dose: itemDraft.dose.trim(),
      unidadeMedida: itemDraft.unidadeMedida?.trim() ?? '',
      frequencia: itemDraft.frequencia.trim(),
      observacoes: itemDraft.observacoes?.trim() ?? '',
    })

    if (!parsed.success) {
      const mapa: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'root')
        if (!mapa[key]) mapa[key] = issue.message
      }
      setErrosDraft(mapa)
      toast.error('Preencha os campos obrigatórios do medicamento.')
      return null
    }

    setErrosDraft({})
    return parsed.data
  }

  const handleIncluirNaLista = () => {
    const item = validarDraft()
    if (!item) return

    if (editandoIndice !== null) {
      setItensLista((lista) => lista.map((i, idx) => (idx === editandoIndice ? item : i)))
      toast.success('Medicamento atualizado na lista.')
    } else {
      setItensLista((lista) => [...lista, item])
      toast.success('Medicamento incluído na prescrição.')
    }

    setItemDraft(itemVazio())
    setEditandoIndice(null)
  }

  const handleEditarItem = (index: number) => {
    const item = itensLista[index]
    if (!item) return
    setItemDraft({ ...item })
    setEditandoIndice(index)
    setErrosDraft({})
  }

  const handleRemoverItem = (index: number) => {
    setItensLista((lista) => lista.filter((_, i) => i !== index))
    if (editandoIndice === index) {
      setItemDraft(itemVazio())
      setEditandoIndice(null)
    } else if (editandoIndice !== null && index < editandoIndice) {
      setEditandoIndice((i) => (i !== null ? i - 1 : null))
    }
  }

  const handleCancelarEdicao = () => {
    setItemDraft(itemVazio())
    setEditandoIndice(null)
    setErrosDraft({})
  }

  const limparPrescricao = () => {
    setItensLista([])
    setItemDraft(itemVazio())
    setObservacoes('')
    setEditandoIndice(null)
    setErrosDraft({})
    setAlertas(null)
  }

  async function enviarPrescricao(payload: {
    observacoes: string
    itens: ItemPrescricao[]
    justificativaMedicaCritica?: string
    confirmarDuplicada?: boolean
  }) {
    setEnviando(true)
    setAlertas(null)

    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/prescricao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prontuarioId,
          tipo: 'PS',
          observacoes: payload.observacoes,
          itens: payload.itens,
          justificativaMedicaCritica: payload.justificativaMedicaCritica ?? '',
          confirmarDuplicada: payload.confirmarDuplicada ?? false,
        }),
      })
      const json = await res.json()

      if (res.status === 409 && json.tipo === 'INTERACAO_CRITICA') {
        setModalCritico({
          aberto: true,
          itemNovo: {
            nomeMedicamento: payload.itens[payload.itens.length - 1]?.nomeMedicamento ?? 'Medicamento',
            principioAtivo: payload.itens[payload.itens.length - 1]?.principioAtivo ?? '',
          },
          interacoes: (json.interacoesCriticas ?? []) as InteracaoCritica[],
          payload,
        })
        toast.error('Interação crítica detectada', {
          description: 'Informe justificativa médica para prosseguir.',
        })
        return
      }

      if (res.status === 409 && json.tipo === 'PRESCRICAO_DUPLICADA') {
        setModalDuplicada({
          aberto: true,
          duplicada: json.duplicada as PrescricaoDuplicada,
          payload,
        })
        toast.warning('Prescrição idêntica já emitida hoje.')
        return
      }

      if (res.status === 422) {
        toast.error('Prescrição bloqueada: alergia detectada!')
        setAlertas({ alergias: json.alertasAlergia, interacoes: json.interacoes, bloqueado: true })
        return
      }

      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao emitir prescrição.')
        return
      }

      if (json.avisos) {
        toast.warning('Prescrição salva com alertas de interação.')
        setAlertas({ interacoes: json.avisos.interacoes, bloqueado: false })
      } else {
        toast.success('Prescrição emitida com sucesso!')
      }

      limparPrescricao()
      onPrescricaoCriada?.()
    } catch {
      toast.error('Erro de conexão ao salvar prescrição.')
    } finally {
      setEnviando(false)
    }
  }

  const handleEmitirPrescricao = () => {
    if (itensLista.length === 0) {
      toast.error('Inclua pelo menos um medicamento na lista antes de emitir.')
      return
    }
    void enviarPrescricao({ observacoes: observacoes.trim(), itens: itensLista })
  }

  const handleConfirmarInteracao = async (justificativa: string): Promise<void> => {
    const payload = modalCritico.payload
    if (!payload) {
      setModalCritico((p) => ({ ...p, aberto: false }))
      return
    }
    setModalCritico((p) => ({ ...p, aberto: false, payload: null }))
    await enviarPrescricao({ ...payload, justificativaMedicaCritica: justificativa })
  }

  const handleConfirmarDuplicada = async (): Promise<void> => {
    const payload = modalDuplicada.payload
    if (!payload) {
      setModalDuplicada((p) => ({ ...p, aberto: false }))
      return
    }
    setModalDuplicada((p) => ({ ...p, aberto: false, payload: null }))
    await enviarPrescricao({ ...payload, confirmarDuplicada: true })
  }

  const handleAtualizarColunaDireita = (index: number, valor: string) => {
    setItensLista((lista) =>
      lista.map((item, idx) => (idx === index ? { ...item, observacoes: valor } : item))
    )
  }

  const resumoItem = (item: ItemPrescricao) =>
    [
      formatarDosePrescricao(item.dose, item.unidadeMedida),
      labelVia(item.via),
      item.frequencia,
      item.duracaoDias ? `${item.duracaoDias} dia(s)` : '',
    ]
      .filter(Boolean)
      .join(' · ')

  return (
    <div className="space-y-5">
      <ModalInteracaoCritica
        aberto={modalCritico.aberto}
        onClose={() => setModalCritico((p) => ({ ...p, aberto: false }))}
        itemNovo={modalCritico.itemNovo}
        interacoes={modalCritico.interacoes}
        onConfirmar={handleConfirmarInteracao}
      />

      <ModalPrescricaoDuplicada
        aberto={modalDuplicada.aberto}
        onClose={() => setModalDuplicada((p) => ({ ...p, aberto: false }))}
        duplicada={modalDuplicada.duplicada}
        onConfirmar={handleConfirmarDuplicada}
      />

      {alertas ? (
        <div className="space-y-3">
          {alertas.alergias?.length ? (
            <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-4 rounded-r-xl">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold mb-2 text-sm">
                <AlertOctagon className="h-5 w-5 shrink-0" aria-hidden />
                Conflito de alergia — prescrição bloqueada
              </div>
              <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
                {alertas.alergias.map((a, i) => (
                  <li key={i}>
                    <strong>{a.medicamento}</strong> conflita com alergia a: {a.alergias.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {alertas.interacoes?.length ? (
            <div className="p-4 rounded-r-xl border-l-4 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-500">
              <div className="flex items-center gap-2 font-bold mb-2 text-sm text-yellow-700 dark:text-yellow-300">
                <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
                Alerta de interação medicamentosa
              </div>
              <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
                {alertas.interacoes.map((int, i) => (
                  <li key={i}>
                    <span className="font-semibold">
                      {int.medicamento1} + {int.medicamento2}
                    </span>{' '}
                    ({int.gravidade})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 1 — Formulário unitário (medicamentos avulsos; oculto no modo formulário hospitalar) */}
      {!isModoLinhaDupla ? (
      <div className="rounded-xl border border-primary/25 bg-primary/[0.03] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" aria-hidden />
            {editandoIndice !== null ? `Editar medicamento #${editandoIndice + 1}` : 'Adicionar medicamento'}
          </h4>
          {editandoIndice !== null ? (
            <button
              type="button"
              onClick={handleCancelarEdicao}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancelar edição
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5">
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Medicamento *</label>
            <input
              value={itemDraft.nomeMedicamento}
              onChange={(e) => atualizarDraft('nomeMedicamento', e.target.value)}
              placeholder="Ex.: Dipirona, Losartana"
              className={inputClass('nomeMedicamento')}
            />
            {errosDraft.nomeMedicamento ? (
              <span className="text-[10px] text-destructive">{errosDraft.nomeMedicamento}</span>
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Dose *</label>
            <input
              value={itemDraft.dose}
              onChange={(e) => atualizarDraft('dose', e.target.value)}
              placeholder="500, 1, 10"
              className={inputClass('dose')}
            />
            {errosDraft.dose ? (
              <span className="text-[10px] text-destructive">{errosDraft.dose}</span>
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Unidade de medida *</label>
            <select
              value={itemDraft.unidadeMedida ?? ''}
              onChange={(e) => atualizarDraft('unidadeMedida', e.target.value)}
              className={inputClass('unidadeMedida')}
            >
              <option value="">Selecione…</option>
              {UNIDADES_MEDIDA.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
            {errosDraft.unidadeMedida ? (
              <span className="text-[10px] text-destructive">{errosDraft.unidadeMedida}</span>
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Via *</label>
            <select
              value={itemDraft.via}
              onChange={(e) => atualizarDraft('via', e.target.value as ItemPrescricao['via'])}
              className={inputClass('via')}
            >
              {VIAS_ADMINISTRACAO.map((v) => (
                <option key={v} value={v}>
                  {labelVia(v)}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Duração (dias)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={itemDraft.duracaoDias ?? ''}
              onChange={(e) => {
                const raw = e.target.value
                atualizarDraft('duracaoDias', raw === '' ? undefined : Number(raw))
              }}
              placeholder="Contínuo"
              className={inputClass()}
            />
          </div>

          <div className="lg:col-span-7">
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Frequência *</label>
            <input
              value={itemDraft.frequencia}
              onChange={(e) => atualizarDraft('frequencia', e.target.value)}
              placeholder="Ex.: 8/8h, Se dor"
              className={inputClass('frequencia')}
            />
            {errosDraft.frequencia ? (
              <span className="text-[10px] text-destructive">{errosDraft.frequencia}</span>
            ) : null}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {FREQUENCIAS_RAPIDAS.map((f) => (
                <button
                  key={f.valor}
                  type="button"
                  onClick={() => atualizarDraft('frequencia', f.valor)}
                  className="px-2 py-0.5 rounded-md border border-border text-[10px] font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Obs. do item</label>
            <input
              value={itemDraft.observacoes ?? ''}
              onChange={(e) => atualizarDraft('observacoes', e.target.value)}
              placeholder="Instruções específicas (opcional)"
              className={inputClass()}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleIncluirNaLista}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <ListPlus className="h-4 w-4" aria-hidden />
            {editandoIndice !== null ? 'Atualizar na lista' : 'Incluir na prescrição'}
          </button>
        </div>
      </div>
      ) : (
        <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/20 px-4 py-3">
          Formulário hospitalar carregado. Preencha a coluna da direita ({colunasModelo?.nomeColunaDireita ?? 'prescrição'}) em cada linha abaixo.
        </p>
      )}

      {/* N — Lista acumulada */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h5 className="text-sm font-bold text-foreground">
            {exibirDuasColunas ? 'Prescrição atual — modelo e ajustes do médico' : 'Prescrição atual'}
            <span className="ml-2 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {itensLista.length} {itensLista.length === 1 ? 'item' : 'itens'}
            </span>
          </h5>
          {itensLista.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setItensLista([])
                handleCancelarEdicao()
              }}
              className="text-xs font-semibold text-muted-foreground hover:text-destructive"
            >
              Limpar lista
            </button>
          ) : null}
        </div>

        {exibirDuasColunas ? (
          <p className="text-xs text-muted-foreground">
            {isModoLinhaDupla
              ? `Coluna "${colunasModelo?.nomeColunaEsquerda ?? 'esquerda'}": texto do cadastro. Coluna "${colunasModelo?.nomeColunaDireita ?? 'direita'}": preenchimento do médico.`
              : 'Coluna da esquerda: parâmetros do modelo. Coluna da direita: valores prescritos.'}
          </p>
        ) : null}

        {itensLista.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
            Nenhum medicamento incluído. Preencha o formulário acima e clique em{' '}
            <strong className="text-foreground">Incluir na prescrição</strong>.
          </p>
        ) : exibirDuasColunas ? (
          <TabelaDuasColunasPrescricaoModelo
            linhas={linhasPrescricao}
            colunas={colunasModelo}
            modo="prescricao"
            renderColunaMedico={
              isModoLinhaDupla
                ? (index) => (
                    <textarea
                      value={itensLista[index]?.observacoes ?? ''}
                      onChange={(e) => handleAtualizarColunaDireita(index, e.target.value)}
                      rows={2}
                      placeholder="Preencha a prescrição desta linha…"
                      className={cn(
                        inputClass(),
                        'resize-y min-h-[3rem] text-sm border-emerald-200 dark:border-emerald-900/50 focus:ring-emerald-500/30 focus:border-emerald-500'
                      )}
                      aria-label={`${colunasModelo?.nomeColunaDireita ?? 'Coluna direita'} — linha ${index + 1}`}
                    />
                  )
                : undefined
            }
            renderAcoes={
              isModoLinhaDupla
                ? undefined
                : (index) => (
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleEditarItem(index)}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    editandoIndice === index
                      ? 'text-primary bg-primary/10'
                      : 'text-primary hover:bg-primary/10'
                  )}
                  aria-label={`Editar item ${index + 1}`}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoverItem(index)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  aria-label={`Remover item ${index + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            )}
          />
        ) : (
          <ul className="space-y-2">
            {itensLista.map((item, index) => (
              <li
                key={`${item.nomeMedicamento}-${index}`}
                className={cn(
                  'rounded-lg border px-3 py-2.5 flex items-start justify-between gap-3',
                  editandoIndice === index ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/20'
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{item.nomeMedicamento}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{resumoItem(item)}</p>
                  {item.observacoes?.trim() ? (
                    <p className="text-xs text-muted-foreground mt-1 italic">{item.observacoes}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEditarItem(index)}
                    className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                    aria-label={`Editar ${item.nomeMedicamento}`}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoverItem(index)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    aria-label={`Remover ${item.nomeMedicamento}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Observações gerais (dieta, repouso, cuidados)
        </label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          className={cn(inputClass(), 'resize-none')}
          placeholder="Orientações gerais para a equipe de enfermagem…"
        />
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-border">
        <button
          type="button"
          onClick={handleEmitirPrescricao}
          disabled={enviando || itensLista.length === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {enviando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Verificando e emitindo…
            </>
          ) : (
            <>
              <FileSignature className="h-4 w-4" aria-hidden />
              Assinar e emitir prescrição ({itensLista.length})
            </>
          )}
        </button>
      </div>
    </div>
  )
}
