'use client'

import { useState } from 'react'
import { AlertTriangle, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type PrescricaoDuplicada = {
  numeroPrescricao?: number | string | null
  emitidaEm?: string | Date | null
  medicamentos: string[]
}

export function ModalPrescricaoDuplicada({
  aberto,
  onClose,
  duplicada,
  onConfirmar,
}: {
  aberto: boolean
  onClose: () => void
  duplicada: PrescricaoDuplicada | null
  onConfirmar: () => Promise<void>
}) {
  const [enviando, setEnviando] = useState(false)

  if (!aberto || !duplicada) return null

  const emitidaEm = duplicada.emitidaEm
    ? duplicada.emitidaEm instanceof Date
      ? duplicada.emitidaEm
      : new Date(duplicada.emitidaEm)
    : null

  async function handleConfirmar() {
    setEnviando(true)
    try {
      await onConfirmar()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !enviando) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-prescricao-duplicada-titulo"
    >
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-amber-300 dark:border-amber-900 m-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 id="modal-prescricao-duplicada-titulo" className="font-semibold text-foreground">
                Prescrição idêntica já emitida hoje
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Confirme se realmente deseja emitir novamente para este paciente.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-1">
            <p className="text-sm text-foreground">
              Já existe a prescrição
              {duplicada.numeroPrescricao != null ? (
                <span className="font-semibold"> #{duplicada.numeroPrescricao}</span>
              ) : null}
              {emitidaEm ? (
                <span> emitida hoje às {format(emitidaEm, 'HH:mm', { locale: ptBR })}</span>
              ) : (
                <span> emitida hoje</span>
              )}{' '}
              com os mesmos medicamentos.
            </p>
          </div>

          {duplicada.medicamentos.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Medicamentos
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {duplicada.medicamentos.map((m, i) => (
                  <li
                    key={`${m}-${i}`}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="p-6 pt-0 flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={enviando}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Emitir mesmo assim
          </button>
        </div>
      </div>
    </div>
  )
}
