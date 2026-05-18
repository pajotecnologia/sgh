// components/triagem/BadgeManchester.tsx
// Badge visual da classificação pelo Protocolo de Manchester

import { cn } from '@/lib/utils';
import type { CorTriagem } from '@/types';

interface BadgeManchesterProps {
  cor: CorTriagem;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const CONFIG: Record<CorTriagem, { label: string; tempo: string; classes: string; dot: string }> = {
  VERMELHO: {
    label: 'Emergência',
    tempo: 'Imediato',
    classes: 'bg-red-600 text-white border-red-700',
    dot: 'bg-red-300',
  },
  LARANJA: {
    label: 'Muito Urgente',
    tempo: '≤ 10 min',
    classes: 'bg-orange-500 text-white border-orange-600',
    dot: 'bg-orange-300',
  },
  AMARELO: {
    label: 'Urgente',
    tempo: '≤ 30 min',
    classes: 'bg-yellow-400 text-yellow-900 border-yellow-500',
    dot: 'bg-yellow-600',
  },
  VERDE: {
    label: 'Pouco Urgente',
    tempo: '≤ 60 min',
    classes: 'bg-green-600 text-white border-green-700',
    dot: 'bg-green-300',
  },
  AZUL: {
    label: 'Não Urgente',
    tempo: '≤ 120 min',
    classes: 'bg-blue-600 text-white border-blue-700',
    dot: 'bg-blue-300',
  },
  CINZA: {
    label: 'Observação',
    tempo: 'Sem prazo',
    classes: 'bg-gray-500 text-white border-gray-600',
    dot: 'bg-gray-300',
  },
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3.5 py-1.5 text-sm gap-2',
};

export function BadgeManchester({
  cor,
  size = 'md',
  showLabel = true,
  className,
}: BadgeManchesterProps) {
  const config = CONFIG[cor];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold border uppercase tracking-wide',
        SIZE_CLASSES[size],
        config.classes,
        className
      )}
      title={`${config.label} — ${config.tempo}`}
    >
      <span className={cn('rounded-full shrink-0', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', config.dot)} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

/** Retorna o hex da cor Manchester para uso inline */
export function corManchesterHex(cor: CorTriagem): string {
  const hexMap: Record<CorTriagem, string> = {
    VERMELHO: '#DC2626',
    LARANJA: '#EA580C',
    AMARELO: '#CA8A04',
    VERDE: '#16A34A',
    AZUL: '#2563EB',
    CINZA: '#6B7280',
  };
  return hexMap[cor];
}
