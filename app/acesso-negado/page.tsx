// app/acesso-negado/page.tsx — Página exibida quando role não tem permissão
import Link from 'next/link';
import { ShieldOff, ArrowLeft } from 'lucide-react';

export default function PaginaAcessoNegado() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
        <p className="text-muted-foreground mb-8">
          Você não tem permissão para acessar este módulo. Entre em contato com o administrador
          do sistema se acreditar que isso é um erro.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
