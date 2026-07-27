'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Syringe,
  Stethoscope,
  Pill,
  CheckCircle2,
  NotebookPen,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { FormularioAplicacaoMedicamento } from '@/components/enfermagem/FormularioAplicacaoMedicamento'
import { LABEL_VIA } from '@/lib/fila-medicacao'
import { formatarDosePrescricao } from '@/lib/prescricao-ui'

type ItemPrescricao = {
  id: string
  nomeMedicamento: string
  dose: string
  unidadeMedida?: string | null
  via: string
  frequencia: string
  status: string
  duracaoDias?: number | null
  observacoes?: string | null
}

type Prescricao = {
  id?: string
  tipo?: string
  numeroPrescricao?: number | string | null
  emitidaEm?: string
  observacoes?: string | null
  itens: ItemPrescricao[]
}

type Evolucao = {
  id: string
  conteudo: string
  registradoEm: string
  autor?: { nome: string } | null
}

type AbaInstrucoesEnfermagemProps = {
  atendimentoId: string
  medicoNome?: string | null
  prescricoes?: Prescricao[]
  evolucoes?: Evolucao[]
  onAtualizar: () => void
}

const sectionCls = 'bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4'
const PREVIEW_CHARS = 220

const stripHtmlBasico = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

function textoEvolucao(ev: Evolucao): string {
  return stripHtmlBasico(ev.conteudo) || ev.conteudo
}

export const AbaInstrucoesEnfermagem = ({
  atendimentoId,
  medicoNome,
  prescricoes = [],
  evolucoes = [],
  onAtualizar,
}: AbaInstrucoesEnfermagemProps) => {
  const itensPendentes = useMemo(
    () => prescricoes.flatMap((pr) => (pr.itens ?? []).filter((it) => it.status === 'PENDENTE')),
    [prescricoes]
  )

  const itensAplicados = useMemo(
    () =>
      prescricoes.flatMap((pr) =>
        (pr.itens ?? []).filter((i) => i.status !== 'PENDENTE')
      ),
    [prescricoes]
  )

  const evolucoesMedicas = useMemo(
    () =>
      [...evolucoes].sort(
        (a, b) => new Date(b.registradoEm).getTime() - new Date(a.registradoEm).getTime()
      ),
    [evolucoes]
  )

  const ultimaPrescricao = prescricoes[0]
  const ultimaEvolucao = evolucoesMedicas[0]

  const [mostrarUltimaPrescricao, setMostrarUltimaPrescricao] = useState(false)
  const [mostrarUltimaEvolucao, setMostrarUltimaEvolucao] = useState(false)
  const [mostrarHistoricoEvolucoes, setMostrarHistoricoEvolucoes] = useState(false)
  const [evolucoesExpandidas, setEvolucoesExpandidas] = useState<Record<string, boolean>>({})
  const [itemAtivoId, setItemAtivoId] = useState<string | null>(null)

  useEffect(() => {
    if (itensPendentes.length === 0) {
      setItemAtivoId(null)
      return
    }
    setItemAtivoId((atual) =>
      atual && itensPendentes.some((i) => i.id === atual) ? atual : itensPendentes[0].id
    )
  }, [itensPendentes])

  const itemAtivo = itensPendentes.find((i) => i.id === itemAtivoId) ?? null
  const indiceAtivo = itemAtivo ? itensPendentes.findIndex((i) => i.id === itemAtivo.id) + 1 : 0

  const toggleEvolucaoExpandida = (id: string) => {
    setEvolucoesExpandidas((s) => ({ ...s, [id]: !s[id] }))
  }

  const evolucoesAnteriores = evolucoesMedicas.slice(1)

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/80 dark:bg-sky-950/30 px-4 py-3 text-sm text-sky-900 dark:text-sky-100">
        <p>
          <strong>Instruções médicas</strong> prescritas no prontuário do internado. Consulte a evolução
          médica, aplique as medicações pendentes e registre a evolução de enfermagem.
          {medicoNome ? (
            <>
              {' '}
              Médico responsável: <strong>{medicoNome}</strong>.
            </>
          ) : null}
        </p>
      </div>

      <nav
        className="flex flex-wrap gap-2 text-xs font-semibold"
        aria-label="Acesso rápido na aba enfermagem"
      >
        {[
          ['#evolucao-medica', 'Evolução médica'],
          ['#prescricao-medica', 'Prescrição médica'],
          ['#medicacao-pendente', 'Medicação'],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="px-3 py-1.5 rounded-full border border-border bg-muted/40 hover:bg-muted transition-colors"
          >
            {label}
          </a>
        ))}
      </nav>

      {ultimaPrescricao?.observacoes?.trim() ? (
        <section className={sectionCls}>
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            Observações da prescrição médica
          </h3>
          <p className="text-sm whitespace-pre-wrap text-foreground">{ultimaPrescricao.observacoes}</p>
          {ultimaPrescricao.emitidaEm ? (
            <p className="text-xs text-muted-foreground">
              Emitida em{' '}
              {format(new Date(ultimaPrescricao.emitidaEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className={sectionCls} id="evolucao-medica">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-primary" />
            Evolução médica (leitura)
          </h3>
          {evolucoesMedicas.length > 0 ? (
            <span className="text-[11px] text-muted-foreground">
              {evolucoesMedicas.length} registro{evolucoesMedicas.length !== 1 ? 's' : ''}
            </span>
          ) : null}
        </div>

        {!ultimaEvolucao ? (
          <p className="text-sm text-muted-foreground">Nenhuma evolução médica registrada no prontuário.</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-primary/25 bg-primary/5 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">Última evolução</p>
                <button
                  type="button"
                  onClick={() => setMostrarUltimaEvolucao((v) => !v)}
                  className="text-xs font-semibold text-primary hover:underline"
                  aria-expanded={mostrarUltimaEvolucao}
                >
                  {mostrarUltimaEvolucao ? 'Ocultar' : 'Ler última evolução'}
                </button>
              </div>
              <div className="flex flex-wrap justify-between gap-2 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {ultimaEvolucao.autor?.nome ?? 'Médico'}
                </span>
                <time dateTime={ultimaEvolucao.registradoEm}>
                  {format(new Date(ultimaEvolucao.registradoEm), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </time>
              </div>
              {mostrarUltimaEvolucao ? (
                <p className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">
                  {textoEvolucao(ultimaEvolucao)}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Clique em &quot;Ler última evolução&quot; para exibir o conteúdo completo antes de aplicar
                  medicações.
                </p>
              )}
            </div>

            {evolucoesAnteriores.length > 0 ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setMostrarHistoricoEvolucoes((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  aria-expanded={mostrarHistoricoEvolucoes}
                >
                  {mostrarHistoricoEvolucoes ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  {mostrarHistoricoEvolucoes
                    ? 'Ocultar evoluções anteriores'
                    : `Ver evoluções anteriores (${evolucoesAnteriores.length})`}
                </button>
                {mostrarHistoricoEvolucoes ? (
                  <ul className="space-y-3">
                    {evolucoesAnteriores.map((ev) => {
                      const texto = textoEvolucao(ev)
                      const expandida = evolucoesExpandidas[ev.id]
                      const preview =
                        texto.length > PREVIEW_CHARS ? `${texto.slice(0, PREVIEW_CHARS)}…` : texto
                      return (
                        <li key={ev.id} className="border border-border rounded-lg p-3 bg-muted/20">
                          <div className="flex flex-wrap justify-between gap-2 text-[11px] text-muted-foreground mb-1.5">
                            <span className="font-semibold text-foreground">
                              {ev.autor?.nome ?? 'Médico'}
                            </span>
                            <time dateTime={ev.registradoEm}>
                              {format(new Date(ev.registradoEm), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </time>
                          </div>
                          <p className="text-xs whitespace-pre-wrap text-foreground leading-relaxed">
                            {expandida ? texto : preview}
                          </p>
                          {texto.length > PREVIEW_CHARS ? (
                            <button
                              type="button"
                              onClick={() => toggleEvolucaoExpandida(ev.id)}
                              className="mt-1.5 text-[11px] font-semibold text-primary hover:underline"
                            >
                              {expandida ? 'Ver menos' : 'Ver mais'}
                            </button>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className={sectionCls} id="prescricao-medica">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            Prescrição médica (somente leitura)
          </h3>
          {ultimaPrescricao ? (
            <button
              type="button"
              onClick={() => setMostrarUltimaPrescricao((v) => !v)}
              className="text-xs font-semibold text-primary hover:underline"
              aria-expanded={mostrarUltimaPrescricao}
            >
              {mostrarUltimaPrescricao ? 'Ocultar prescrição' : 'Ler última prescrição'}
            </button>
          ) : null}
        </div>
        {!ultimaPrescricao ? (
          <p className="text-sm text-muted-foreground">Nenhuma prescrição médica registrada.</p>
        ) : mostrarUltimaPrescricao ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                Prescrição #{ultimaPrescricao.numeroPrescricao ?? '—'}
                {medicoNome ? ` · ${medicoNome}` : ''}
              </span>
              {ultimaPrescricao.emitidaEm ? (
                <time dateTime={ultimaPrescricao.emitidaEm}>
                  {format(new Date(ultimaPrescricao.emitidaEm), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </time>
              ) : null}
            </div>
            {ultimaPrescricao.observacoes?.trim() ? (
              <p className="text-sm whitespace-pre-wrap text-foreground border-l-2 border-primary/30 pl-3">
                {ultimaPrescricao.observacoes}
              </p>
            ) : null}
            <ul className="divide-y divide-border/60 rounded-lg border border-border bg-card/80">
              {(ultimaPrescricao.itens ?? []).map((i) => (
                <li key={i.id} className="px-3 py-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-foreground">{i.nomeMedicamento}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatarDosePrescricao(i.dose, i.unidadeMedida)} · {LABEL_VIA[i.via] ?? i.via} · {i.frequencia}
                    {i.duracaoDias ? ` · ${i.duracaoDias} dia(s)` : ''}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded',
                      i.status === 'PENDENTE'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                    )}
                  >
                    {i.status}
                  </span>
                  {i.observacoes?.trim() ? (
                    <span className="text-xs text-amber-800 dark:text-amber-200 w-full">
                      {i.observacoes}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Clique em &quot;Ler última prescrição&quot; para conferir medicações antes de aplicar.
          </p>
        )}
      </section>

      <section className={sectionCls} id="medicacao-pendente">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            Confirmar aplicação de medicação
          </h3>
          <span
            className={cn(
              'text-[11px] font-semibold px-2 py-0.5 rounded-full border',
              itensPendentes.length > 0
                ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200'
            )}
          >
            {itensPendentes.length} pendente{itensPendentes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {itensPendentes.length === 0 ? (
          <div className="border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" aria-hidden />
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              Nenhuma dose pendente de aplicação no momento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Selecione o medicamento, confira os 5 certos e registre a aplicação.
              {itensPendentes.length > 1 ? (
                <>
                  {' '}
                  Item {indiceAtivo} de {itensPendentes.length}.
                </>
              ) : null}
            </p>

            <ul className="flex flex-wrap gap-2" role="listbox" aria-label="Medicamentos pendentes">
              {itensPendentes.map((it) => {
                const ativo = it.id === itemAtivoId
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={ativo}
                      onClick={() => setItemAtivoId(it.id)}
                      className={cn(
                        'text-left rounded-lg border px-3 py-2 text-xs transition-colors max-w-full',
                        ativo
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30'
                          : 'border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground'
                      )}
                    >
                      <span className="font-semibold block truncate">{it.nomeMedicamento}</span>
                      <span className="text-[10px] opacity-80">
                        {formatarDosePrescricao(it.dose, it.unidadeMedida)} · {LABEL_VIA[it.via] ?? it.via}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            {itemAtivo ? (
              <div className="space-y-2">
                {itemAtivo.observacoes?.trim() ? (
                  <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                    <strong>Instrução do item:</strong> {itemAtivo.observacoes}
                  </p>
                ) : null}
                <FormularioAplicacaoMedicamento
                  key={itemAtivo.id}
                  atendimentoId={atendimentoId}
                  contexto="internacao"
                  item={{
                    id: itemAtivo.id,
                    nomeMedicamento: itemAtivo.nomeMedicamento,
                    dose: formatarDosePrescricao(itemAtivo.dose, itemAtivo.unidadeMedida),
                    via: itemAtivo.via,
                    frequencia: itemAtivo.frequencia,
                  }}
                  onAplicado={onAtualizar}
                />
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className={sectionCls}>
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Syringe className="h-4 w-4" />
          Histórico de aplicações (imutável)
        </h4>
        {itensAplicados.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum item aplicado ou finalizado ainda.</p>
        ) : (
          <ul className="space-y-2">
            {itensAplicados.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-2 border border-border rounded-lg px-3 py-2 bg-muted/20"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{i.nomeMedicamento}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatarDosePrescricao(i.dose, i.unidadeMedida)} · {LABEL_VIA[i.via] ?? i.via} · {i.frequencia}
                  </p>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  {i.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
