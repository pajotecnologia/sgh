'use client';
// components/atendimento/BotaoChamarPainel.tsx
// Abre o modal de sala/setor para exibir o paciente no painel de chamadas.

import { useState } from 'react';
import { Monitor } from 'lucide-react';
import { ModalChamarPaciente } from '@/components/triagem/ModalChamarPaciente';
import { cn } from '@/lib/utils';

interface BotaoChamarPainelProps {
  atendimentoId: string;
  className?: string;
  /** Texto ao lado do ícone; string vazia = só ícone (use `title` para o tooltip). */
  label?: string;
  /** Tooltip quando `label` está vazio; padrão explica o painel de chamadas. */
  title?: string;
}

const TITLE_PADRAO = 'Chamar paciente — exibe no painel de chamadas e pode anunciar por voz';

export function BotaoChamarPainel({
  atendimentoId,
  className,
  label = 'Chamar paciente',
  title,
}: BotaoChamarPainelProps) {
  const [aberto, setAberto] = useState(false);
  const titulo = title ?? (label ? `${label} (painel de chamadas)` : TITLE_PADRAO);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAberto(true);
        }}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-colors shrink-0',
          label
            ? 'px-3 py-2 bg-sky-600 text-white text-xs hover:bg-sky-700'
            : 'p-2 bg-sky-600 text-white hover:bg-sky-700',
          className
        )}
        title={titulo}
      >
        <Monitor className="h-4 w-4 shrink-0" />
        {label ? <span>{label}</span> : null}
      </button>
      {aberto && (
        <ModalChamarPaciente
          atendimentoId={atendimentoId}
          onClose={() => setAberto(false)}
          onSuccess={() => setAberto(false)}
        />
      )}
    </>
  );
}
