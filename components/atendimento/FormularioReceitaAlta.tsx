'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileSignature, Printer } from 'lucide-react'
import { FormularioPrescricao } from '@/components/atendimento/FormularioPrescricao'
import { filtrarPrescricoesReceitaAlta } from '@/lib/prescricao-tipo'
import { LABEL_VIA } from '@/lib/fila-medicacao'

type PrescricaoReceita = {
  id: string
  numeroPrescricao: number
  emitidaEm?: string
  createdAt?: string
  observacoes?: string | null
  itens: {
    id: string
    nomeMedicamento: string
    dose: string
    via: string
    frequencia: string
    duracaoDias?: number | null
    observacoes?: string | null
  }[]
}

export function FormularioReceitaAlta({
  atendimentoId,
  prontuarioId,
  prescricoes = [],
  onSalvo,
  somenteLeitura = false,
}: {
  atendimentoId: string
  prontuarioId: string
  prescricoes?: PrescricaoReceita[]
  onSalvo: () => void
  somenteLeitura?: boolean
}) {
  const receitas = filtrarPrescricoesReceitaAlta(
    prescricoes.map((p) => ({ ...p, tipo: 'RECEITA_ALTA' as const }))
  )

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
        <p>
          <strong>Receita de alta</strong> — medicamentos para uso em casa após o atendimento no pronto-socorro.
          Não entra na fila de aplicação da enfermagem (Medicação PS).
        </p>
      </div>

      {receitas.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-primary" />
            Receitas emitidas ({receitas.length})
          </h3>
          {receitas.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="bg-muted/40 px-4 py-2 border-b border-border flex flex-wrap justify-between items-center gap-2 text-sm">
                <span className="font-semibold text-foreground">
                  Receita #{p.numeroPrescricao}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {format(
                      new Date(p.emitidaEm ?? p.createdAt ?? Date.now()),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}
                  </span>
                  <Link
                    href={`/atendimento/receita/imprimir/${p.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/5"
                  >
                    <Printer className="h-3.5 w-3.5" aria-hidden />
                    Imprimir
                  </Link>
                </div>
              </div>
              <div className="p-4">
                {p.observacoes?.trim() ? (
                  <p className="text-xs text-muted-foreground mb-3 whitespace-pre-wrap">{p.observacoes}</p>
                ) : null}
                <ul className="space-y-2 text-sm">
                  {p.itens.map((it) => (
                    <li key={it.id} className="flex flex-wrap gap-x-2">
                      <span className="font-semibold">{it.nomeMedicamento}</span>
                      <span className="text-muted-foreground">
                        {it.dose} · {LABEL_VIA[it.via] ?? it.via} · {it.frequencia}
                        {it.duracaoDias ? ` · ${it.duracaoDias} dia(s)` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma receita de alta registrada ainda.</p>
      )}

      {!somenteLeitura ? (
        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-bold text-foreground mb-4">Nova receita de alta</h3>
          <FormularioPrescricao
            atendimentoId={atendimentoId}
            prontuarioId={prontuarioId}
            tipoPrescricao="RECEITA_ALTA"
            onPrescricaoCriada={(id) => {
              onSalvo()
              if (id) {
                window.open(`/atendimento/receita/imprimir/${id}`, '_blank', 'noopener,noreferrer')
              }
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
