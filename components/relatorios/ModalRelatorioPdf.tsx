'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Download, ExternalLink, Printer, X, FileText } from 'lucide-react'

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
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.focus()
        iframeRef.current.contentWindow.print()
        return
      }
    } catch {
      // Fallback
    }
    window.open(pdfUrl, '_blank', 'noopener,noreferrer')
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = nomeArquivo
    a.click()
  }

  const handleAbrirNovaAba = () => {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={safeTitle}
    >
      <div className="bg-card w-full max-w-5xl h-[min(90vh,820px)] rounded-2xl shadow-2xl border border-border m-4 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between p-4 border-b border-border gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{safeTitle}</p>
            <p className="text-[11px] text-muted-foreground truncate">{nomeArquivo}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAbrirNovaAba}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50 transition-colors"
              title="Abrir em nova aba"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Nova aba
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <Printer className="h-4 w-4" aria-hidden />
              Imprimir
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50 transition-colors"
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

        <div className="flex-1 bg-muted/20 relative">
          <object
            data={pdfUrl}
            type="application/pdf"
            className="w-full h-full"
          >
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              title={safeTitle}
              className="w-full h-full border-0"
            >
              <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Não foi possível carregar a pré-visualização do PDF na tela.</p>
                <p className="text-xs text-muted-foreground">Seu navegador bloqueou o leitor de PDF embutido.</p>
                <button
                  type="button"
                  onClick={handleAbrirNovaAba}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir PDF em nova aba
                </button>
              </div>
            </iframe>
          </object>
        </div>
      </div>
    </div>
  )
}

