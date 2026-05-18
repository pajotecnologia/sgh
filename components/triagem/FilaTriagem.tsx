'use client';
// components/triagem/FilaTriagem.tsx
// Fila de triagem com atualização em tempo real via Pusher + polling de fallback

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Users } from 'lucide-react';
import { CardPacienteEspera } from './CardPacienteEspera';
import { ModalChamarPaciente } from './ModalChamarPaciente';
import { getPusherCliente, CANAIS_PUSHER, EVENTOS_PUSHER } from '@/lib/pusher';
import { cn } from '@/lib/utils';
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
  /** Mostrar botão "Chamar para atendimento" (role MEDICO/ENFERMEIRO/ADMIN) */
  podeCharmar?: boolean;
}

export function FilaTriagem({ podeCharmar = false }: FilaTriagemProps) {
  const [fila, setFila] = useState<PacienteNaFila[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<string>('TODOS');
  const [atendimentoParaChamar, setAtendimentoParaChamar] = useState<string | null>(null);

  const carregarFila = useCallback(async () => {
    try {
      const res = await fetch('/api/triagem/fila?status=AGUARDANDO_ATENDIMENTO');
      const json = await res.json();
      if (json.sucesso) setFila(json.dados);
    } catch {
      toast.error('Erro ao carregar fila de triagem.');
    } finally {
      setCarregando(false);
    }
  }, []);

  // Carregar fila inicial
  useEffect(() => {
    carregarFila();
  }, [carregarFila]);

  // Escutar eventos Pusher para atualização em tempo real; sem credenciais, só polling mais frequente
  useEffect(() => {
    const pusher = getPusherCliente();
    if (!pusher) {
      const polling = setInterval(carregarFila, 15_000);
      return () => clearInterval(polling);
    }

    const canal = pusher.subscribe(CANAIS_PUSHER.filaTriagem);

    canal.bind(EVENTOS_PUSHER.FILA_ATUALIZADA, (data: { nomePaciente: string; corClassificacao: string }) => {
      // Tocar alerta sonoro para vermelhos e laranjas
      if (data.corClassificacao === 'VERMELHO' || data.corClassificacao === 'LARANJA') {
        toast.warning(`⚠️ Paciente ${data.nomePaciente} — ${data.corClassificacao}`, {
          description: 'Triagem de alta prioridade registrada!',
          duration: 8000,
        });
        // Tentar tocar som de alerta
        try {
          const audio = new Audio('/sons/alerta-urgente.mp3');
          audio.volume = 0.7;
          audio.play().catch(() => {});
        } catch {}
      }
      // Recarregar fila
      carregarFila();
    });

    // Polling de fallback a cada 60s (caso Pusher falhe)
    const polling = setInterval(carregarFila, 60_000);

    return () => {
      canal.unbind_all();
      pusher.unsubscribe(CANAIS_PUSHER.filaTriagem);
      clearInterval(polling);
    };
  }, [carregarFila]);

  const filaFiltrada = filtro === 'TODOS'
    ? fila
    : fila.filter((p) => p.corTriagem === filtro);

  const totalAlertas = fila.filter((p) => p.alertaUltrapassado).length;

  return (
    <div className="space-y-4">
      {/* Cabeçalho da fila */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">
              Fila de Espera
            </span>
            <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-medium">
              {fila.length} paciente{fila.length !== 1 ? 's' : ''}
            </span>
          </div>
          {totalAlertas > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold animate-pulse">
              {totalAlertas} com tempo excedido!
            </span>
          )}
        </div>

        <button
          onClick={carregarFila}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors"
          aria-label="Atualizar fila"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </button>
      </div>

      {/* Filtros por cor */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTROS_COR.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltro(f.valor)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-all',
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
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filaFiltrada.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhum paciente na fila{filtro !== 'TODOS' ? ` (${filtro})` : ''}.</p>
        </div>
      ) : (
        <div className="grid gap-3" role="list" aria-label="Fila de espera">
          {filaFiltrada.map((p) => (
            <div key={p.atendimentoId} role="listitem">
              <CardPacienteEspera
                {...p}
                mostrarBotaoChamar={podeCharmar}
                onChamar={(id) => setAtendimentoParaChamar(id)}
              />
            </div>
          ))}
        </div>
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
