'use client';
// app/painel/error.tsx — Error Boundary específico para o Painel de TV
import { useEffect } from 'react';
import { RefreshCw, Tv } from 'lucide-react';

export default function PainelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PainelTV Error]', error);
    // Auto reconectar/recarregar a cada 10 segundos em caso de falha transitória
    const timer = setTimeout(() => {
      reset();
    }, 10000);
    return () => clearTimeout(timer);
  }, [error, reset]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6">
          <Tv className="w-10 h-10 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Painel de Atendimento</h1>
        <p className="text-slate-400 text-sm mb-6">
          Reconectando ao servidor em instantes...
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all"
        >
          <RefreshCw className="w-5 h-5 animate-spin" />
          Reconectar agora
        </button>
      </div>
    </div>
  );
}
