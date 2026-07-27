'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Download, Printer, X } from 'lucide-react'

export function ModalRelatorioPdf({
  aberto,
  onClose,
  pdfUrl,
  nomeArquivo,
  titulo,
}: {
  aberto: boolean
  onClose: () => void
  pdfUrl: string
  nomeArquivo: string
  titulo: string
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const safeTitle = useMemo(() => titulo.trim() || 'Relatório', [titulo])

  useEffect(() => {
    if (!aberto) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [aberto, onClose])

  if (!aberto) return null

  const handlePrint = () => {
    try {
      iframeRef.current?.contentWindow?.focus()
      iframeRef.current?.contentWindow?.print()
    } catch {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = nomeArquivo
    a.click()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={safeTitle}
    >
      <div className="bg-card w-full max-w-5xl h-[min(90vh,780px)] rounded-2xl shadow-2xl border border-border m-4 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{safeTitle}</p>
            <p className="text-[11px] text-muted-foreground truncate">{nomeArquivo}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
            >
              <Printer className="h-4 w-4" aria-hidden />
              Imprimir
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50"
            >
              <Download className="h-4 w-4" aria-hidden />
              Baixar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Fechar modal"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-muted/20">
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            title={safeTitle}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  )
}
