'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, X } from 'lucide-react';

/** Banner exibido quando a lista da recepção abre com `?cadastrado=…` (ex.: após novo cadastro). */
export function BannerPosCadastro() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const raw = searchParams.get('cadastrado');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!!raw && raw !== '0');
  }, [raw]);

  if (!visible || !raw || raw === '0') return null;

  let mensagem = 'Paciente cadastrado com sucesso.';
  if (raw === 'triagem') {
    mensagem = 'Paciente cadastrado e encaminhado para a fila de triagem.';
  } else if (raw !== '1' && raw !== 'ok') {
    try {
      mensagem = decodeURIComponent(raw);
    } catch {
      mensagem = raw;
    }
  }

  function fechar() {
    setVisible(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('cadastrado');
    const q = params.toString();
    router.replace(`/recepcao${q ? `?${q}` : ''}`);
  }

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-50"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold">Cadastro concluído</p>
        <p className="text-xs opacity-90">{mensagem}</p>
      </div>
      <button
        type="button"
        onClick={fechar}
        className="shrink-0 rounded-lg p-1 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
        aria-label="Fechar aviso"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
