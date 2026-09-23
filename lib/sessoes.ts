import { createHash, randomUUID } from 'node:crypto';

export const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000;

export function criarIdentificadorSessao(): string {
  return randomUUID();
}

export function hashIdentificadorSessao(sessionId: string): string {
  return createHash('sha256').update(sessionId, 'utf8').digest('hex');
}

export function obterDispositivo(userAgent?: string | null): string {
  const ua = (userAgent ?? '').toLowerCase();
  if (!ua) return 'Dispositivo desconhecido';

  const navegador = ua.includes('edg/')
    ? 'Edge'
    : ua.includes('chrome/')
      ? 'Chrome'
      : ua.includes('firefox/')
        ? 'Firefox'
        : ua.includes('safari/')
          ? 'Safari'
          : 'Navegador';

  const sistema = ua.includes('windows')
    ? 'Windows'
    : ua.includes('android')
      ? 'Android'
      : ua.includes('iphone') || ua.includes('ipad')
        ? 'iOS'
        : ua.includes('mac os')
          ? 'macOS'
          : ua.includes('linux')
            ? 'Linux'
            : 'Outro';

  return `${navegador} / ${sistema}`;
}
