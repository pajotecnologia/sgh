'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Copy,
  Pill,
  Syringe,
} from 'lucide-react'
import { FormularioPrescricaoInternacao } from '@/components/internamento/FormularioPrescricaoInternacao'
import { SeletorPrescricaoMedicaPadrao } from '@/components/internamento/SeletorPrescricaoMedicaPadrao'
import {
  classeStatusItemPrescricao,
  formatarDosePrescricao,
  formatarResumoLinhaPrescricao,
  labelVia,
  LABEL_STATUS_ITEM_PRESCRICAO,
  separarDoseUnidade,
} from '@/lib/prescricao-ui'
import {
  copiarItensUltimaPrescricao,
  type AtendimentoInternacaoCtx,
} from '@/lib/prefill-internamento'
import type { ColunasPrescricaoModelo } from '@/lib/prescricao-modelo-colunas'
import type { CriarPrescricaoForm } from '@/lib/validations/atendimento'

type Aplicacao = {
  id: string
  aplicadoEm: string
  doseAplicada: string
  aplicadoPor?: { nome: string } | null
}

type ItemPrescricao = {
  id: string
  nomeMedicamento: string
  dose: string
  unidadeMedida?: string | null
  via: string
  frequencia: string
  status: string
  observacoes?: string | null
  duracaoDias?: number | null
  aplicacoes?: Aplicacao[]
}

type PrescricaoResumo = {
  id: string
  tipo?: string
  numeroPrescricao?: number | string | null
  emitidaEm?: string | Date
  createdAt?: string | Date
  observacoes?: string | null
  itens?: ItemPrescricao[]
}

type AbaPrescricoesInternacaoProps = {
  atendimentoId: string
  prontuarioId: string
  ctxInternacao: AtendimentoInternacaoCtx
  prescricoes?: PrescricaoResumo[]
  somenteLeituraMedicacoes?: boolean
  onAtualizar: () => void
}

function dataPrescricao(p: PrescricaoResumo) {
  const raw = p.emitidaEm ?? p.createdAt
  if (!raw) return null
  return raw instanceof Date ? raw : new Date(raw)
}

const VIAS_VALIDAS = [
  'ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA',
  'TOPICA', 'INALATORIA', 'SUBLINGUAL', 'RETAL', 'OFTALMICA', 'OTOLOGICA', 'NASAL',
] as const

function copiarItensPrescricao(p: PrescricaoResumo): CriarPrescricaoForm['itens'] {
  return (p.itens ?? [])
    .filter((item) => item.nomeMedicamento?.trim())
    .map((item) => {
      const { dose, unidadeMedida } = separarDoseUnidade(
        item.dose?.trim() || '',
        item.unidadeMedida
      )
      return {
        nomeMedicamento: item.nomeMedicamento.trim(),
        principioAtivo: '',
        dose: dose || 'conforme prescrição anterior',
        unidadeMedida: unidadeMedida || 'mg',
        via: VIAS_VALIDAS.includes(item.via as typeof VIAS_VALIDAS[number])
          ? (item.via as CriarPrescricaoForm['itens'][number]['via'])
          : 'ORAL',
        frequencia: item.frequencia?.trim() || 'conforme prescrição anterior',
        quantidadeSolicitada: 1,
        duracaoDias: item.duracaoDias ?? undefined,
        observacoes: item.observacoes?.trim() ?? '',
      }
    })
}

export function AbaPrescricoesInternacao({
  atendimentoId,
  prontuarioId,
  ctxInternacao,
  prescricoes = [],
  somenteLeituraMedicacoes = false,
  onAtualizar,
}: AbaPrescricoesInternacaoProps) {
  const prescricoesPs = useMemo(
    () => prescricoes.filter((p) => (p.tipo ?? 'PS') === 'PS'),
    [prescricoes]
  )
  const [prefillItens, setPrefillItens] = useState<CriarPrescricaoForm['itens'] | undefined>(undefined)
  const [prefillObservacoes, setPrefillObservacoes] = useState<string | undefined>(undefined)
  const [referenciaModeloItens, setReferenciaModeloItens] = useState<
    CriarPrescricaoForm['itens'] | undefined
  >(undefined)
  const [colunasModelo, setColunasModelo] = useState<ColunasPrescricaoModelo | undefined>(undefined)
  const [formKey, setFormKey] = useState(0)
  const [mostrarUltimaPrescricao, setMostrarUltimaPrescricao] = useState(false)
  const [prescricaoVisualizadaId, setPrescricaoVisualizadaId] = useState<string | null>(null)
  const ultimaPrescricao = prescricoesPs[0] ?? null

  const repetirUltima = () => {
    const copiados = copiarItensUltimaPrescricao(ctxInternacao)
    setPrefillItens(copiados.length ? (copiados as CriarPrescricaoForm['itens']) : [])
    setPrefillObservacoes(undefined)
    setReferenciaModeloItens(undefined)
    setColunasModelo(undefined)
    setFormKey((k) => k + 1)
  }

  const carregarPrescricao = (p: PrescricaoResumo) => {
    const copiados = copiarItensPrescricao(p)
    if (!copiados.length) return
    setPrefillItens(copiados)
    setPrefillObservacoes(p.observacoes?.trim() || undefined)
    setReferenciaModeloItens(undefined)
    setColunasModelo(undefined)
    setFormKey((k) => k + 1)
    setPrescricaoVisualizadaId(null)
  }

  const carregarModeloPrescricao = (
    itens: CriarPrescricaoForm['itens'],
    observacoes?: string,
    colunas?: ColunasPrescricaoModelo
  ) => {
    setPrefillItens([...itens])
    setReferenciaModeloItens(itens.map((item) => ({ ...item })))
    setColunasModelo(colunas)
    setPrefillObservacoes(observacoes ?? '')
    setFormKey((k) => k + 1)
  }

  const limparFormulario = () => {
    setPrefillItens([])
    setPrefillObservacoes('')
    setReferenciaModeloItens(undefined)
    setColunasModelo(undefined)
    setFormKey((k) => k + 1)
  }

  const handlePrescricaoCriada = () => {
    limparFormulario()
    onAtualizar()
  }

  return (
    <div className="space-y-8">
      <section id="secao-medicacoes" className="bg-card border border-primary/20 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 sm:px-5 py-4 border-b border-border bg-primary/5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">Medicações da internação</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adicione um medicamento por vez e inclua na lista. Emita a prescrição quando terminar.
            </p>
            <Link
              href={`/evolucoes/${atendimentoId}?aba=INSTRUCOES_ENFERMAGEM`}
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Syringe className="h-3.5 w-3.5" aria-hidden />
              Ver aplicação na enfermagem
            </Link>
          </div>
          {!somenteLeituraMedicacoes ? (
            <div className="flex flex-col items-stretch sm:items-end gap-3 w-full sm:w-auto">
              <SeletorPrescricaoMedicaPadrao onCarregar={carregarModeloPrescricao} />
              <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setMostrarUltimaPrescricao((v) => !v)}
                disabled={!ultimaPrescricao}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50 transition-colors disabled:opacity-40"
              >
                <Pill className="h-3.5 w-3.5" aria-hidden />
                {mostrarUltimaPrescricao ? 'Ocultar última prescrição' : 'Ler última prescrição'}
              </button>
              {prescricoesPs.length > 0 ? (
                <button
                  type="button"
                  onClick={repetirUltima}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  Repetir última prescrição
                </button>
              ) : null}
              <button
                type="button"
                onClick={limparFormulario}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Limpar lista
              </button>
              </div>
            </div>
          ) : null}
        </div>

        {mostrarUltimaPrescricao && ultimaPrescricao ? (
          <div className="p-4 sm:p-5 border-b border-border bg-muted/20">
            <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground mb-2">
              <span className="font-semibold text-foreground">
                Última prescrição #{ultimaPrescricao.numeroPrescricao ?? '—'}
              </span>
              {dataPrescricao(ultimaPrescricao) ? (
                <span>{format(dataPrescricao(ultimaPrescricao)!, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              ) : null}
            </div>
            {ultimaPrescricao.observacoes?.trim() ? (
              <p className="text-sm whitespace-pre-wrap text-foreground border-l-2 border-primary/30 pl-2 mb-2">
                {ultimaPrescricao.observacoes}
              </p>
            ) : null}
            <ul className="space-y-1.5">
              {(ultimaPrescricao.itens ?? []).map((i) => (
                <li key={i.id} className="text-sm flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-medium">{i.nomeMedicamento}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatarResumoLinhaPrescricao(i)}
                    {i.duracaoDias ? ` · ${i.duracaoDias} dia(s)` : ''}
                  </span>
                </li>
              ))}
            </ul>
            {!somenteLeituraMedicacoes ? (
              <button
                type="button"
                onClick={() => carregarPrescricao(ultimaPrescricao)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden />
                Carregar como nova prescrição
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="p-4 sm:p-5">
          {somenteLeituraMedicacoes ? (
            <p className="text-sm text-muted-foreground">
              Prescrições de medicação são registradas pelo médico. A enfermagem pode acompanhar aqui e aplicar em{' '}
              <Link href={`/evolucoes/${atendimentoId}?aba=INSTRUCOES_ENFERMAGEM`} className="text-primary font-semibold hover:underline">
                Prontuário Enfermagem → Enfermagem
              </Link>
              .
            </p>
          ) : (
            <FormularioPrescricaoInternacao
              key={formKey}
              atendimentoId={atendimentoId}
              prontuarioId={prontuarioId}
              prefillItens={prefillItens}
              prefillObservacoes={prefillObservacoes}
              referenciaModeloItens={referenciaModeloItens}
              colunasModelo={colunasModelo}
              onPrescricaoCriada={handlePrescricaoCriada}
            />
          )}
        </div>
      </section>

      <section id="secao-historico-prescricao">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Histórico (imutável)
        </h4>
        {prescricoesPs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma prescrição registrada ainda.</p>
        ) : (
          <ul className="space-y-4">
            {prescricoesPs.map((p) => {
              const dt = dataPrescricao(p)
              const expandida = prescricaoVisualizadaId === p.id
              return (
                <li key={p.id} className="border border-border rounded-lg p-4 bg-muted/20">
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground mb-2">
                    <span className="font-semibold text-foreground">
                      <Pill className="h-3.5 w-3.5 inline mr-1.5 text-primary" aria-hidden />
                      Prescrição #{p.numeroPrescricao ?? '—'}
                    </span>
                    {dt ? (
                      <span>{format(dt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setPrescricaoVisualizadaId(expandida ? null : p.id)}
                      className="text-xs font-semibold text-primary hover:underline"
                      aria-expanded={expandida}
                    >
                      {expandida ? 'Ocultar detalhes' : 'Visualizar prescrição'}
                    </button>
                    {!somenteLeituraMedicacoes ? (
                      <button
                        type="button"
                        onClick={() => carregarPrescricao(p)}
                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" aria-hidden />
                        Carregar como nova prescrição
                      </button>
                    ) : null}
                  </div>
                  {expandida ? (
                    <>
                      {p.observacoes?.trim() ? (
                        <p className="text-sm whitespace-pre-wrap text-foreground border-l-2 border-primary/30 pl-2 mb-2">
                          {p.observacoes}
                        </p>
                      ) : null}
                      <ul className="space-y-1.5">
                        {(p.itens ?? []).map((i) => (
                          <li key={i.id} className="text-sm flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="font-medium">{i.nomeMedicamento}</span>
                            <span className="text-muted-foreground text-xs">
                              {formatarResumoLinhaPrescricao(i)}
                              {i.duracaoDias ? ` · ${i.duracaoDias} dia(s)` : ''}
                            </span>
                            <span
                              className={`text-[10px] uppercase px-1 py-0.5 rounded font-bold ${classeStatusItemPrescricao(i.status)}`}
                            >
                              {LABEL_STATUS_ITEM_PRESCRICAO[i.status] ?? i.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
