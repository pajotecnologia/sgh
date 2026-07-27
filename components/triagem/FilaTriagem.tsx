'use client';
// components/triagem/FilaTriagem.tsx
// Fila de triagem com atualização em tempo real via Pusher + polling de fallback

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Users } from 'lucide-react';
import { CardPacienteEspera } from './CardPacienteEspera';
import { ModalChamarPaciente } from './ModalChamarPaciente';
import { getPusherCliente, CANAIS_PUSHER, EVENTOS_PUSHER } from '@/lib/pusher';
import { escutarFilaAtualizada, fetchFilaTriagem } from '@/lib/fila-triagem-sync';
import { cn } from '@/lib/utils';
import { EnvoltorioListaPaginada } from '@/components/shared/EnvoltorioListaPaginada';
import type { CorTriagem } from '@/types';

interface PacienteNaFila {
  atendimentoId: string;
  numeroAtendimento: string;
  nomePaciente: string;
  corTriagem: CorTriagem | null;
  labelCor: string;
  tempoMaximoMinutos: number | null;
  entradaFila: string;
  tempoEsperaMinutos: number;
  alertaUltrapassado: boolean;
  queixaPrincipal: string | null;
}

const FILTROS_COR = [
  { valor: 'TODOS', label: 'Todos' },
  { valor: 'VERMELHO', label: 'Vermelho', cor: '#DC2626' },
  { valor: 'LARANJA', label: 'Laranja', cor: '#EA580C' },
  { valor: 'AMARELO', label: 'Amarelo', cor: '#CA8A04' },
  { valor: 'VERDE', label: 'Verde', cor: '#16A34A' },
  { valor: 'AZUL', label: 'Azul', cor: '#2563EB' },
  { valor: 'CINZA', label: 'Cinza', cor: '#6B7280' },
] as const;

interface FilaTriagemProps {
  podeCharmar?: boolean;
  compacto?: boolean;
  mostrarLinkAtendimento?: boolean;
  titulo?: string;
}

export function FilaTriagem({
  podeCharmar = false,
  compacto = false,
  mostrarLinkAtendimento = false,
  titulo = 'Fila de Espera',
}: FilaTriagemProps) {
  const [fila, setFila] = useState<PacienteNaFila[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<string>('TODOS');
  const [atendimentoParaChamar, setAtendimentoParaChamar] = useState<string | null>(null);

  const carregarFila = useCallback(async (silencioso = false) => {
    try {
      const res = await fetchFilaTriagem('/api/triagem/fila?tipo=pos-triagem');
      const json = await res.json();
      if (json.sucesso) setFila(json.dados);
    } catch {
      if (!silencioso) toast.error('Erro ao carregar fila de triagem.');
    } finally {
      setCarregando(false);
    }
  }, []);

  // Carregar fila inicial
  useEffect(() => {
    carregarFila();
  }, [carregarFila]);

  // Polling + sync entre abas + Pusher
  useEffect(() => {
    const polling = setInterval(() => carregarFila(true), 5_000);
    const pararEscuta = escutarFilaAtualizada(() => carregarFila(true));

    const pusher = getPusherCliente();
    if (pusher) {
      const canal = pusher.subscribe(CANAIS_PUSHER.filaTriagem);
      canal.bind(EVENTOS_PUSHER.FILA_ATUALIZADA, (data: { nomePaciente: string; corClassificacao: string }) => {
        if (data.corClassificacao === 'VERMELHO' || data.corClassificacao === 'LARANJA') {
          toast.warning(`⚠️ Paciente ${data.nomePaciente} — ${data.corClassificacao}`, {
            description: 'Triagem de alta prioridade registrada!',
            duration: 8000,
          });
          try {
            const audio = new Audio('/sons/alerta-urgente.mp3');
            audio.volume = 0.7;
            audio.play().catch(() => {});
          } catch {}
        }
        carregarFila(true);
      });

      return () => {
        clearInterval(polling);
        pararEscuta();
        canal.unbind_all();
        pusher.unsubscribe(CANAIS_PUSHER.filaTriagem);
      };
    }

    return () => {
      clearInterval(polling);
      pararEscuta();
    };
  }, [carregarFila]);

  const filaFiltrada = filtro === 'TODOS'
    ? fila
    : fila.filter((p) => p.corTriagem === filtro);

  const totalAlertas = fila.filter((p) => p.alertaUltrapassado).length;

  return (
    <div className={cn('space-y-3', compacto && 'text-xs')}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Users className={cn('text-muted-foreground shrink-0', compacto ? 'h-4 w-4' : 'h-5 w-5')} />
          <span className={cn('font-semibold truncate', compacto ? 'text-xs' : 'text-sm')}>{titulo}</span>
          <span className="px-1.5 py-0.5 bg-muted rounded-full text-[10px] font-medium shrink-0">
            {fila.length}
          </span>
          {totalAlertas > 0 && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-semibold animate-pulse shrink-0">
              {totalAlertas}!
            </span>
          )}
        </div>

        <button
          onClick={() => carregarFila()}
          className="flex items-center gap-1 px-2 py-1 text-[10px] border border-border rounded-md hover:bg-muted transition-colors shrink-0"
          aria-label="Atualizar fila"
        >
          <RefreshCw className="h-3 w-3" />
          Atualizar
        </button>
      </div>

      <div className="flex gap-1 flex-wrap">
        {FILTROS_COR.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltro(f.valor)}
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all',
              filtro === f.valor
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-background hover:bg-muted'
            )}
          >
            {'cor' in f && (
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: f.cor }}
              />
            )}
            {f.label}
            {f.valor !== 'TODOS' && (
              <span className="ml-1 opacity-70">
                ({fila.filter((p) => p.corTriagem === f.valor).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista de pacientes */}
      {carregando ? (
        <div className={cn('grid', compacto ? 'gap-1.5' : 'gap-3')}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn('bg-muted rounded-lg animate-pulse', compacto ? 'h-14' : 'h-28')} />
          ))}
        </div>
      ) : filaFiltrada.length === 0 ? (
        <div className={cn('text-center text-muted-foreground', compacto ? 'py-8' : 'py-16')}>
          <Users className={cn('mx-auto mb-2 opacity-30', compacto ? 'h-7 w-7' : 'h-10 w-10')} />
          <p className={compacto ? 'text-[11px]' : 'text-sm font-medium'}>Nenhum paciente na fila{filtro !== 'TODOS' ? ` (${filtro})` : ''}.</p>
        </div>
      ) : (
        <EnvoltorioListaPaginada
          items={filaFiltrada}
          chaveReset={`${filaFiltrada.length}-${filtro}`}
          compacto={compacto}
        >
          {(fatia) => (
        <div className={cn('grid max-h-[calc(100vh-220px)] overflow-y-auto pr-1', compacto ? 'gap-1.5' : 'gap-3')} role="list" aria-label="Fila de espera">
          {fatia.map((p) => (
            <div key={p.atendimentoId} role="listitem">
              <CardPacienteEspera
                {...p}
                compacto={compacto}
                mostrarBotaoChamar={podeCharmar}
                mostrarLinkAtendimento={mostrarLinkAtendimento}
                onChamar={(id) => setAtendimentoParaChamar(id)}
              />
            </div>
          ))}
        </div>
          )}
        </EnvoltorioListaPaginada>
      )}

      {/* Modal de chamada */}
      {atendimentoParaChamar && (
        <ModalChamarPaciente
          atendimentoId={atendimentoParaChamar}
          onClose={() => setAtendimentoParaChamar(null)}
          onSuccess={() => {
            setAtendimentoParaChamar(null);
            carregarFila();
          }}
        />
      )}
    </div>
  );
}
