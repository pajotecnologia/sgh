// lib/rate-limit.ts
// Rate Limiter em memória com algoritmo de janela滑动 (Sliding Window)

type RateLimitRecord = {
  timestamps: number[];
};

const store = new Map<string, RateLimitRecord>();

// Limpeza periódica a cada 10 minutos para evitar vazamento de memória
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const agora = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => agora - ts < 600000);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 600000);
}

export type RateLimitOptions = {
  /** Quantidade máxima de requisições permitidas no intervalo */
  limite: number;
  /** Janela de tempo em segundos (padrão: 60s) */
  janelaSegundos: number;
};

export function verificarRateLimit(
  chave: string,
  opcoes: RateLimitOptions = { limite: 5, janelaSegundos: 60 }
): { sucesso: boolean; restantes: number; retryAfterSegundos: number } {
  const agora = Date.now();
  const janelaMs = opcoes.janelaSegundos * 1000;

  let record = store.get(chave);
  if (!record) {
    record = { timestamps: [] };
    store.set(chave, record);
  }

  // Filtrar requisições fora da janela atual
  record.timestamps = record.timestamps.filter((ts) => agora - ts < janelaMs);

  if (record.timestamps.length >= opcoes.limite) {
    const maisAntigo = record.timestamps[0];
    const retryAfter = Math.ceil((maisAntigo + janelaMs - agora) / 1000);
    return {
      sucesso: false,
      restantes: 0,
      retryAfterSegundos: Math.max(1, retryAfter),
    };
  }

  record.timestamps.push(agora);

  return {
    sucesso: true,
    restantes: opcoes.limite - record.timestamps.length,
    retryAfterSegundos: 0,
  };
}

export function obterIpCliente(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

export function __resetRateLimitParaTestes() {
  store.clear();
}
