// lib/triagem-estado-consciencia-sinais.ts
// Parâmetros clínicos — estado/consciência e sinais circulatórios/respiratórios (grade institucional).

/** Estado neurológico / comportamental */
export const PARAMETROS_CLINICOS_ESTADO_KEYS = [
  'CONSCIENTE',
  'ORIENTADO',
  'DESORIENTADO',
  'ANSIOSO',
  'CALMO',
  'AGITADO',
  'TORPOROSO',
  'COMATOSO',
  'NAO_ATENDE_VOZ_COMANDO',
] as const;

/** Sinais circulatórios e respiratórios */
export const PARAMETROS_CLINICOS_CIRCULATORY_KEYS = [
  'RITMO_SINUSAL',
  'PALPITACOES',
  'TAQUICARDIA',
  'BRADICARDIA',
  'DISPNEIA_ESFORCOS',
  'DISPNEIA_REPOUSO',
  'DISPNEIA_NOTURNA',
  'CIANOSE',
  'PALIDEZ',
  'SUDORESE',
] as const;

/** Todas as chaves persistidas em CSV no campo `estadoConscienciaSinais` da triagem */
export const ESTADO_CONSCIENCIA_SINAIS_KEYS = [
  ...PARAMETROS_CLINICOS_ESTADO_KEYS,
  ...PARAMETROS_CLINICOS_CIRCULATORY_KEYS,
] as const;

export type EstadoConscienciaSinaisKey = (typeof ESTADO_CONSCIENCIA_SINAIS_KEYS)[number];

export const ESTADO_CONSCIENCIA_SINAIS_LABELS: Record<EstadoConscienciaSinaisKey, string> = {
  CONSCIENTE: 'Consciente',
  ORIENTADO: 'Orientado',
  DESORIENTADO: 'Desorientado',
  ANSIOSO: 'Ansioso',
  CALMO: 'Calmo',
  AGITADO: 'Agitado',
  TORPOROSO: 'Torporoso',
  COMATOSO: 'Comatoso',
  NAO_ATENDE_VOZ_COMANDO: 'Não atende voz de comando',
  RITMO_SINUSAL: 'Ritmo sinusal',
  PALPITACOES: 'Palpitações',
  TAQUICARDIA: 'Taquicardia',
  BRADICARDIA: 'Bradicardia',
  DISPNEIA_ESFORCOS: 'Dispnéia aos esforços',
  DISPNEIA_REPOUSO: 'Dispneia em repouso',
  DISPNEIA_NOTURNA: 'Dispneia noturna',
  CIANOSE: 'Cianose',
  PALIDEZ: 'Palidez',
  SUDORESE: 'Sudorese',
};

const VALID = new Set<string>(ESTADO_CONSCIENCIA_SINAIS_KEYS);

/** Serializa seleção múltipla para o campo texto no banco (ou `null` se vazio). */
export function estadoConscienciaSinaisKeysToCsv(keys: EstadoConscienciaSinaisKey[]): string | null {
  if (!keys?.length) return null;
  return keys.join(',');
}

/**
 * Parseia CSV da triagem para conjunto (impressão da ficha usa `.has(key)`).
 * Chaves antigas não reconhecidas são ignoradas.
 */
export function parseEstadoConscienciaSinaisCsv(
  raw: string | null | undefined
): Set<EstadoConscienciaSinaisKey> {
  const s = new Set<EstadoConscienciaSinaisKey>();
  if (!raw?.trim()) return s;
  for (const part of raw.split(',')) {
    const k = part.trim();
    if (VALID.has(k)) s.add(k as EstadoConscienciaSinaisKey);
  }
  return s;
}
