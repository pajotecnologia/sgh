'use client';
// components/triagem/CardPacienteEspera.tsx
// Card de paciente na fila de triagem/atendimento com código de senha, tipo e tempo de espera

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Monitor, Printer, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { BadgeManchester } from './BadgeManchester';
import { alertaTempoManchester } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { CorTriagem } from '@/types';
import type { TipoAtendimentoInfo } from '@/lib/senhas';

interface CardPacienteEsperaProps {
  atendimentoId: string;
  numeroAtendimento: string;
  senha?: string;
  tipoAtendimento?: TipoAtendimentoInfo;
  idadeAnos?: number | null;
  nomePaciente: string;
  corTriagem: CorTriagem | null;
  labelCor: string;
  entradaFila: string;
  tempoMaximoMinutos: number | null;
  queixaPrincipal: string | null;
  onChamar?: (atendimentoId: string) => void;
  mostrarBotaoChamar?: boolean;
  mostrarLinkAtendimento?: boolean;
  compacto?: boolean;
}

function minutosDesde(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
}

function formatarTempo(minutos: number): string {
  if (minutos < 60) return `${minutos}min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h}h${m > 0 ? ` ${m}min` : ''}`;
}

export function CardPacienteEspera({
  atendimentoId,
  numeroAtendimento,
  senha,
  tipoAtendimento,
  idadeAnos,
  nomePaciente,
  corTriagem,
  labelCor,
  entradaFila,
  tempoMaximoMinutos,
  queixaPrincipal,
  onChamar,
  mostrarBotaoChamar = false,
  mostrarLinkAtendimento = false,
  compacto = false,
}: CardPacienteEsperaProps) {
  const [tempoEspera, setTempoEspera] = useState(() => minutosDesde(entradaFila));

  useEffect(() => {
    const interval = setInterval(() => {
      setTempoEspera(minutosDesde(entradaFila));
    }, 30_000);
    return () => clearInterval(interval);
  }, [entradaFila]);

  const alerta = corTriagem
    ? alertaTempoManchester(corTriagem, tempoEspera)
    : false;

  const percentTempo = tempoMaximoMinutos
    ? Math.min(100, Math.round((tempoEspera / tempoMaximoMinutos) * 100))
    : 0;

  const corBarra =
    percentTempo >= 100
      ? 'bg-red-500'
      : percentTempo >= 75
      ? 'bg-orange-400'
      : 'bg-primary';

  return (
    <div
      className={cn(
        'bg-card border rounded-lg transition-all duration-200 group',
        compacto ? 'p-2.5' : 'p-4 rounded-xl',
        alerta
          ? 'border-red-400 shadow-red-100 shadow-sm alert-triagem-urgente'
          : 'border-border hover:shadow-sm'
      )}
      role="article"
      aria-label={`Paciente ${nomePaciente}`}
    >
      <div className={cn('flex items-start', compacto ? 'gap-2' : 'gap-3')}>
        {/* Indicador lateral de cor Manchester */}
        {corTriagem && (
          <div
            className="w-1.5 self-stretch rounded-full shrink-0"
            style={{
              backgroundColor: {
                VERMELHO: '#DC2626',
                LARANJA: '#EA580C',
                AMARELO: '#CA8A04',
                VERDE: '#16A34A',
                AZUL: '#2563EB',
                CINZA: '#6B7280',
              }[corTriagem],
            }}
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Cabeçalho do card: Senha + Nome + Badges */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              {senha && (
                <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-500/40">
                  {senha}
                </span>
              )}
              {tipoAtendimento && (
                <span className={cn('text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border', tipoAtendimento.bgBadge)}>
                  {tipoAtendimento.nomeCurto}
                </span>
              )}
              {alerta && (
                <AlertTriangle className={cn('text-red-500 shrink-0 animate-pulse', compacto ? 'h-3 w-3' : 'h-4 w-4')} aria-label="Tempo excedido!" />
              )}
              <span className={cn('font-bold text-foreground truncate', compacto ? 'text-xs' : 'text-sm')}>
                {nomePaciente}
              </span>
              {idadeAnos !== undefined && idadeAnos !== null && (
                <span className="text-[10px] text-muted-foreground">({idadeAnos} anos)</span>
              )}
            </div>
            {corTriagem && <BadgeManchester cor={corTriagem} size="sm" />}
          </div>

          <p className={cn('font-mono text-muted-foreground mb-1', compacto ? 'text-[10px]' : 'text-[11px] mb-2')}>
            #{numeroAtendimento}
          </p>

          {queixaPrincipal && !compacto && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{queixaPrincipal}</p>
          )}
          {queixaPrincipal && compacto && (
            <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1">{queixaPrincipal}</p>
          )}

          {tempoMaximoMinutos !== null && tempoMaximoMinutos > 0 && (
            <div className={compacto ? 'mb-1.5' : 'mb-3'}>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                <span>Tempo de Espera</span>
                <span className={alerta ? 'text-red-500 font-semibold' : ''}>
                  {formatarTempo(tempoEspera)} / {formatarTempo(tempoMaximoMinutos)}
                </span>
              </div>
              <div className={cn('bg-muted rounded-full overflow-hidden', compacto ? 'h-1' : 'h-1.5')}>
                <div
                  className={cn('h-full rounded-full transition-all duration-1000', corBarra)}
                  style={{ width: `${percentTempo}%` }}
                />
              </div>
            </div>
          )}

          {(tempoMaximoMinutos === null || corTriagem === null) && (
            <div className={cn('flex items-center gap-1 text-muted-foreground', compacto ? 'text-[10px] mb-1' : 'text-xs mb-3')}>
              <Clock className={compacto ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
              <span>Aguardando há {formatarTempo(tempoEspera)}</span>
            </div>
          )}

          <div className={cn('flex items-center gap-1.5 border-t border-border/50', compacto ? 'mt-1.5 pt-1.5' : 'mt-3 pt-3 gap-2')}>
            <Link
              href={`/recepcao/imprimir-senha/${numeroAtendimento}`}
              target="_blank"
              title="Imprimir Ticket Térmico 80mm"
              className={cn(
                'flex items-center justify-center gap-1 rounded-md font-medium bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors',
                compacto ? 'flex-1 py-1 text-[10px]' : 'flex-1 py-1.5 text-[11px]'
              )}
            >
              <Printer className={compacto ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
              Senha 80mm
            </Link>

            {mostrarBotaoChamar && onChamar && (
              <button
                type="button"
                onClick={() => onChamar(atendimentoId)}
                className={cn(
                  'flex items-center justify-center gap-1 rounded-md font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-sm',
                  compacto ? 'flex-1 py-1 text-[10px]' : 'flex-1 py-1.5 text-[11px]'
                )}
                aria-label={`Chamar ${nomePaciente}`}
              >
                <Monitor className={compacto ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                Chamar TV
              </button>
            )}

            {mostrarLinkAtendimento && (
              <Link
                href={`/atendimento/${atendimentoId}`}
                className={cn(
                  'flex items-center justify-center gap-1 rounded-md font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm',
                  compacto ? 'flex-1 py-1 text-[10px]' : 'flex-1 py-1.5 text-[11px]'
                )}
              >
                <Stethoscope className={compacto ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                Atender
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
