'use client';
// components/triagem/CardPacienteEspera.tsx
// Card de paciente na fila de triagem com tempo de espera em tempo real

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Stethoscope, Printer } from 'lucide-react';
import Link from 'next/link';
import { BadgeManchester } from './BadgeManchester';
import { alertaTempoManchester } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { CorTriagem } from '@/types';

interface CardPacienteEsperaProps {
  atendimentoId: string;
  numeroAtendimento: string;
  nomePaciente: string;
  corTriagem: CorTriagem | null;
  labelCor: string;
  entradaFila: string; // ISO string
  tempoMaximoMinutos: number | null;
  queixaPrincipal: string | null;
  onChamar?: (atendimentoId: string) => void;
  mostrarBotaoChamar?: boolean;
}

/** Calcula minutos desde uma data */
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
  nomePaciente,
  corTriagem,
  labelCor,
  entradaFila,
  tempoMaximoMinutos,
  queixaPrincipal,
  onChamar,
  mostrarBotaoChamar = false,
}: CardPacienteEsperaProps) {
  // Atualizar tempo de espera a cada 30 segundos
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

  // Calcular % do tempo usado para a barra de progresso
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
        'bg-card border rounded-xl p-4 transition-all duration-200 group',
        alerta
          ? 'border-red-400 shadow-red-100 shadow-md alert-triagem-urgente'
          : 'border-border hover:shadow-sm'
      )}
      role="article"
      aria-label={`Paciente ${nomePaciente}`}
    >
      <div className="flex items-start gap-3">
        {/* Indicador de cor Manchester — barra lateral */}
        {corTriagem && (
          <div
            className="w-1 self-stretch rounded-full shrink-0"
            style={{
              backgroundColor: {
                VERMELHO: '#DC2626', LARANJA: '#EA580C', AMARELO: '#CA8A04',
                VERDE: '#16A34A', AZUL: '#2563EB', CINZA: '#6B7280',
              }[corTriagem],
            }}
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Cabeçalho do card */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              {alerta && (
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 animate-pulse" aria-label="Tempo excedido!" />
              )}
              <span className="font-semibold text-sm text-foreground truncate">{nomePaciente}</span>
            </div>
            {corTriagem && <BadgeManchester cor={corTriagem} size="sm" />}
          </div>

          {/* Número de atendimento */}
          <p className="font-mono text-[11px] text-muted-foreground mb-2">{numeroAtendimento}</p>

          {/* Queixa */}
          {queixaPrincipal && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{queixaPrincipal}</p>
          )}

          {/* Barra de tempo */}
          {tempoMaximoMinutos !== null && tempoMaximoMinutos > 0 && (
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Tempo de espera</span>
                <span className={alerta ? 'text-red-500 font-semibold' : ''}>
                  {formatarTempo(tempoEspera)} / {formatarTempo(tempoMaximoMinutos)}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-1000', corBarra)}
                  style={{ width: `${percentTempo}%` }}
                />
              </div>
            </div>
          )}

          {/* Tempo sem limite (CINZA) */}
          {(tempoMaximoMinutos === null || corTriagem === null) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <Clock className="h-3.5 w-3.5" />
              <span>Aguardando há {formatarTempo(tempoEspera)}</span>
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
            <Link
              href={`/recepcao/imprimir/${numeroAtendimento}`}
              target="_blank"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              aria-label={`Imprimir ficha ${nomePaciente}`}
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir
            </Link>
            
            {mostrarBotaoChamar && onChamar && (
              <button
                onClick={() => onChamar(atendimentoId)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                aria-label={`Chamar ${nomePaciente}`}
              >
                <Stethoscope className="h-3.5 w-3.5" />
                Chamar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
