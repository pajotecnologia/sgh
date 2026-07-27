'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  User,
  Stethoscope,
  Syringe,
} from 'lucide-react'
import { BadgeManchester } from '@/components/triagem/BadgeManchester'
import { NomePacienteComProntuario } from '@/components/medicacao/NomePacienteComProntuario'
import { formatarDataAtendimento } from '@/lib/medicacao-pesquisa'
import {
  LABEL_STATUS_ATENDIMENTO,
  LABEL_VIA,
  resumoChecklistCinco,
} from '@/lib/fila-medicacao'
import type { CorTriagem } from '@/types'
import type { GrupoPacienteAplicadas } from '@/components/medicacao/HistoricoMedicacoesAplicadas'
import { cn } from '@/lib/utils'

export function ListaHistoricoAplicadasCompacta({
  grupos,
}: {
  grupos: GrupoPacienteAplicadas[]
}) {
  const [abertoId, setAbertoId] = useState<string | null>(null)

  const handleToggle = (atendimentoId: string) => {
    setAbertoId((atual) => (atual === atendimentoId ? null : atendimentoId))
  }

  const handleKeyDown = (e: React.KeyboardEvent, atendimentoId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle(atendimentoId)
    }
  }

  return (
    <ul className="border border-border rounded-lg divide-y divide-border overflow-hidden bg-card">
      {grupos.map((grupo) => {
        const aberto = abertoId === grupo.atendimentoId
        return (
          <li key={grupo.atendimentoId}>
            <button
              type="button"
              onClick={() => handleToggle(grupo.atendimentoId)}
              onKeyDown={(e) => handleKeyDown(e, grupo.atendimentoId)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                aberto && 'bg-muted/30'
              )}
              aria-expanded={aberto}
              aria-controls={`historico-aplicadas-${grupo.atendimentoId}`}
            >
              {aberto ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className="flex-1 min-w-0">
                <NomePacienteComProntuario
                  nome={grupo.nomePaciente}
                  numeroProntuario={grupo.numeroProntuario}
                  nomeClassName="text-xs"
                />
              </span>
              <span className="shrink-0 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                {grupo.totalAplicacoes} aplic.
              </span>
            </button>

            {aberto && (
              <div
                id={`historico-aplicadas-${grupo.atendimentoId}`}
                className="border-t border-border bg-muted/10 px-2 pb-2 pt-1.5 space-y-1.5"
              >
                <CabecalhoPacienteExpandido grupo={grupo} />

                <ul className="space-y-1">
                  {grupo.aplicacoes.map((ap) => (
                    <DetalheAplicacaoCompacta key={ap.id} aplicacao={ap} medicoNome={grupo.medicoNome} />
                  ))}
                </ul>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function CabecalhoPacienteExpandido({ grupo }: { grupo: GrupoPacienteAplicadas }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
      <span>Atend. {formatarDataAtendimento(grupo.dataAtendimento)}</span>
      {grupo.corTriagem ? (
        <BadgeManchester cor={grupo.corTriagem as CorTriagem} size="sm" />
      ) : null}
      <span className="px-1 py-0.5 bg-muted rounded font-medium text-foreground/80">
        {LABEL_STATUS_ATENDIMENTO[grupo.status as keyof typeof LABEL_STATUS_ATENDIMENTO] ??
          grupo.status}
      </span>
      {grupo.medicoNome && (
        <span className="inline-flex items-center gap-0.5">
          <Stethoscope className="h-2.5 w-2.5" />
          {grupo.medicoNome}
        </span>
      )}
      <Link
        href={`/medicacao/${grupo.atendimentoId}?aba=aplicadas`}
        className="ml-auto text-primary font-semibold hover:underline"
      >
        Atendimento →
      </Link>
    </div>
  )
}

function DetalheAplicacaoCompacta({
  aplicacao: ap,
  medicoNome,
}: {
  aplicacao: GrupoPacienteAplicadas['aplicacoes'][number]
  medicoNome: string | null
}) {
  const checklist = resumoChecklistCinco(ap.checklistConfirmado)
  const viaPrescrita = LABEL_VIA[ap.itemPrescricao.via] ?? ap.itemPrescricao.via
  const viaAplicada = LABEL_VIA[ap.via] ?? ap.via
  const aplicadoEm = new Date(ap.aplicadoEm)

  return (
    <li className="rounded-md border border-emerald-200/50 dark:border-emerald-900/40 bg-card overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 px-2 py-1 bg-emerald-50/60 dark:bg-emerald-950/25 border-b border-emerald-100/80 dark:border-emerald-900/40">
        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
        <span className="text-[10px] font-semibold text-emerald-900 dark:text-emerald-100">
          {format(aplicadoEm, "dd/MM/yy HH:mm", { locale: ptBR })}
        </span>
        <span className="text-[10px] font-bold text-foreground flex items-center gap-1 min-w-0 flex-1 truncate">
          <Syringe className="h-3 w-3 text-primary shrink-0" />
          {ap.itemPrescricao.nomeMedicamento}
        </span>
        <span className="text-[9px] text-emerald-800 dark:text-emerald-200 font-medium shrink-0">
          {checklist.completo ? '5✓' : `${checklist.ok}/5`}
        </span>
      </div>

      <div className="px-2 py-1.5 text-[10px] leading-snug space-y-1">
        <p className="text-muted-foreground">
          <span className="text-foreground/70">Dose:</span> {ap.itemPrescricao.dose}
          <span className="mx-1 text-border">→</span>
          <span className="font-medium text-emerald-700 dark:text-emerald-300">{ap.doseAplicada}</span>
          <span className="mx-1.5 text-border">·</span>
          <span className="text-foreground/70">Via:</span> {viaPrescrita}
          <span className="mx-0.5">→</span>
          {viaAplicada}
          <span className="mx-1.5 text-border">·</span>
          <span className="text-foreground/70">Freq:</span> {ap.itemPrescricao.frequencia}
        </p>

        <p className="text-muted-foreground">
          <span className="text-foreground/70">Presc.:</span> #{ap.itemPrescricao.prescricao.numeroPrescricao}{' '}
          {format(new Date(ap.itemPrescricao.prescricao.emitidaEm), 'dd/MM/yy')}
          <span className="mx-1.5 text-border">·</span>
          <User className="h-2.5 w-2.5 inline -mt-px" /> {ap.aplicadoPor.nome}
          {medicoNome && (
            <>
              <span className="mx-1.5 text-border">·</span>
              <Stethoscope className="h-2.5 w-2.5 inline -mt-px" /> {medicoNome}
            </>
          )}
        </p>

        {(ap.itemPrescricao.observacoes || ap.observacoes) && (
          <p className="text-muted-foreground italic line-clamp-2">
            {ap.itemPrescricao.observacoes && (
              <span>
                <span className="not-italic font-medium text-foreground/80">Presc:</span>{' '}
                {ap.itemPrescricao.observacoes}
              </span>
            )}
            {ap.itemPrescricao.observacoes && ap.observacoes && ' · '}
            {ap.observacoes && (
              <span>
                <span className="not-italic font-medium text-foreground/80">Apl:</span> {ap.observacoes}
              </span>
            )}
          </p>
        )}
      </div>
    </li>
  )
}
