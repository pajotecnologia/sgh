// lib/ficha-dor-irradiacao.ts
// Locais de irradiação da dor — alinhado a `schemaRegistrarTriagem` (triagem).

export const IRRADIACAO_DOR_SITE_KEYS = [
  'BRACO_E',
  'BRACO_D',
  'ESCAPULA',
  'MANDIBULA',
  'TORAX_POSTERIOR',
  'ABDOME',
] as const;

export type IrradiacaoDorSiteKey = (typeof IRRADIACAO_DOR_SITE_KEYS)[number];

export const IRRADIACAO_DOR_SITE_LABELS: Record<IrradiacaoDorSiteKey, string> = {
  BRACO_E: 'Braço esquerdo',
  BRACO_D: 'Braço direito',
  ESCAPULA: 'Escápula',
  MANDIBULA: 'Mandíbula',
  TORAX_POSTERIOR: 'Tórax posterior',
  ABDOME: 'Abdome',
};

const VALID = new Set<string>(IRRADIACAO_DOR_SITE_KEYS);

/** Parseia CSV gravado na triagem (`BRACO_E,ABDOME`). */
export function parseIrradiacaoDorSitesCsv(csv: string | null | undefined): IrradiacaoDorSiteKey[] {
  if (!csv?.trim()) return [];
  const out: IrradiacaoDorSiteKey[] = [];
  for (const part of csv.split(',')) {
    const k = part.trim();
    if (VALID.has(k)) out.push(k as IrradiacaoDorSiteKey);
  }
  return out;
}
