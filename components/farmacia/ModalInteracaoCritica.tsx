'use client'

import { useMemo, useState } from 'react'
import { AlertOctagon, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type InteracaoCritica = {
  principioAtivoNovo: string
  principioAtivoExistente: string
  efeitoClinico: string
  sugestaoSistema: string
}

export function ModalInteracaoCritica({
  aberto,
  onClose,
  itemNovo,
  interacoes,
  onConfirmar,
}: {
  aberto: boolean
  onClose: () => void
  itemNovo: { nomeMedicamento: string; principioAtivo?: string }
  interacoes: InteracaoCritica[]
  onConfirmar: (justificativa: string) => Promise<void>
}) {
  const [justificativa, setJustificativa] = useState('')
  const [enviando, setEnviando] = useState(false)

  const valido = useMemo(() => justificativa.trim().length >= 15, [justificativa])

  if (!aberto) return null

  async function handleConfirmar() {
    if (!valido) return
    setEnviando(true)
    try {
      await onConfirmar(justificativa.trim())
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
      aria-labelledby="modal-interacao-critica-titulo"
    >
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-red-300 dark:border-red-900 m-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200">
              <AlertOctagon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 id="modal-interacao-critica-titulo" className="font-semibold text-foreground">
                Interação crítica detectada
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Para evitar dano ao paciente, a prescrição só pode prosseguir com justificativa médica.
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
          <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-200">
              Item novo digitado
            </p>
            <p className="text-sm font-semibold text-foreground mt-1">{itemNovo.nomeMedicamento}</p>
            {itemNovo.principioAtivo ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                Princípio ativo: <span className="font-mono">{itemNovo.principioAtivo}</span>
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Conflitos encontrados
            </p>
            <ul className="space-y-2">
              {interacoes.map((i, idx) => (
                <li key={idx} className="border border-border rounded-xl bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {i.principioAtivoNovo} × {i.principioAtivoExistente}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-200 mt-1">
                    <strong>Efeito clínico:</strong> {i.efeitoClinico}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Sugestão do sistema:</strong> {i.sugestaoSistema}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Justificativa médica obrigatória <span className="text-destructive">*</span>
            </label>
            <textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={4}
              className={cn(
                'w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm outline-none transition-all',
                'focus:ring-2 focus:ring-red-500/30 focus:border-red-500',
                !valido && justificativa.length > 0 ? 'border-destructive' : 'border-input'
              )}
              placeholder="Descreva o motivo clínico para manter a combinação apesar do risco (mín. 15 caracteres)."
              aria-label="Justificativa médica"
            />
            <p className={cn('text-xs', valido ? 'text-muted-foreground' : 'text-destructive')}>
              {valido ? 'OK' : `Mínimo de 15 caracteres (${justificativa.trim().length}/15).`}
            </p>
          </div>
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
            disabled={!valido || enviando}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-semibold text-white',
              'bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600',
              'inline-flex items-center gap-2'
            )}
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Confirmar e salvar prescrição
          </button>
        </div>
      </div>
    </div>
  )
}
