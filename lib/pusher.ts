// lib/pusher.ts
// Clientes Pusher para comunicação em tempo real
// Servidor: envia eventos | Cliente: escuta eventos
// Funciona sem Pusher quando as variáveis de ambiente estão vazias (apenas tempo real é desabilitado).

// ---- SERVIDOR (só usar em Server Components / Route Handlers) ----
import PusherServer from 'pusher';
// ---- CLIENTE (usar em Client Components) ----
import PusherClient from 'pusher-js';

const globalForPusher = globalThis as unknown as {
  pusherServidor: PusherServer | undefined;
};

export function servidorPusherConfigurado(): boolean {
  const id = process.env.PUSHER_APP_ID?.trim();
  const key = process.env.PUSHER_KEY?.trim();
  const secret = process.env.PUSHER_SECRET?.trim();
  const cluster = process.env.PUSHER_CLUSTER?.trim();
  return Boolean(id && key && secret && cluster);
}

/** Instância servidor ou null quando credenciais Pusher não estão definidas */
export function getPusherServidor(): PusherServer | null {
  if (!servidorPusherConfigurado()) return null;
  const existing = globalForPusher.pusherServidor;
  if (existing) return existing;
  const instancia = new PusherServer({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
  });
  globalForPusher.pusherServidor = instancia;
  return instancia;
}

/** Fire-and-forget: não faz nada se o servidor Pusher não estiver configurado */
export function dispararEventoPusher(
  canal: string,
  evento: string,
  dados: object
): void {
  const p = getPusherServidor();
  if (!p) return;
  void p.trigger(canal, evento, dados).catch((err: Error) => {
    console.warn('[Pusher] Falha ao emitir evento (ignorando):', err.message);
  });
}

// Singleton do cliente navegador
let pusherClienteInstance: PusherClient | null = null;

export function clientePusherConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_PUSHER_KEY?.trim() &&
      process.env.NEXT_PUBLIC_PUSHER_CLUSTER?.trim()
  );
}

/** Retorna null se chaves públicas não estiverem definidas — use polling nos componentes */
export function getPusherCliente(): PusherClient | null {
  if (!clientePusherConfigurado()) return null;
  if (!pusherClienteInstance) {
    pusherClienteInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return pusherClienteInstance;
}

// =============================================================================
// CANAIS E EVENTOS — Nomes centralizados para evitar typos
// =============================================================================

export const CANAIS_PUSHER = {
  /// Canal do painel de chamada por setor
  painel: (setor: string) => `painel-${setor}`,
  /// Canal da fila de triagem
  filaTriagem: 'fila-triagem',
  /// Canal da farmácia / triagem de medicamentos
  farmaciaTriagem: 'farmacia-triagem',
  /// Canal de alertas de emergência
  alertas: 'alertas',
} as const;

export const EVENTOS_PUSHER = {
  /// Novo paciente chamado para atendimento
  CHAMADA_PACIENTE: 'chamada-paciente',
  /// Fila de triagem atualizada (novo paciente ou classificação)
  FILA_ATUALIZADA: 'fila-atualizada',
  /// Nova prescrição emitida pelo médico no PS
  NOVA_PRESCRICAO: 'nova-prescricao',
  /// Alerta de tempo excedido (vermelho/laranja)
  ALERTA_TEMPO: 'alerta-tempo',
} as const;
