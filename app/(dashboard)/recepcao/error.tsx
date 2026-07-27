'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function ErroRecepcao({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[recepcao]', error)
  }, [error])

  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
        <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden />
      </div>
      <h2 className="text-xl font-bold">Não foi possível abrir esta página</h2>
      <p className="text-sm text-muted-foreground">
        Verifique no servidor: conexão com o PostgreSQL (<code className="text-xs bg-muted px-1 rounded">DATABASE_URL</code>),
        variável <code className="text-xs bg-muted px-1 rounded">ENCRYPTION_KEY</code> (64 hex no .env)
        e se o PM2 foi reiniciado após alterar o .env.
      </p>
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
        <Link
          href="/recepcao"
          className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à recepção
        </Link>
      </div>
    </div>
  )
}
