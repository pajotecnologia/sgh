'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldOff, ArrowLeft, Home } from 'lucide-react';

export default function PaginaAcessoNegado() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Você não possui permissão para acessar este módulo ou funcionalidade. Entre em contato com o administrador do sistema para ajustar suas permissões de acesso.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" />
            Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
