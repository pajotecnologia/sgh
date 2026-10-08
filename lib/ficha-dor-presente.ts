// lib/ficha-dor-presente.ts
// Marcadores de momento em que a dor se manifesta — alinhado à ficha de urgência e triagem.

export const DOR_PRESENTE_KEYS = [
  'EM_REPOUSO',
  'AOS_ESFORCOS',
  'AO_RESPIRAR',
] as const;

export type DorPresenteKey = (typeof DOR_PRESENTE_KEYS)[number];

export const DOR_PRESENTE_LABELS: Record<DorPresenteKey, string> = {
  EM_REPOUSO: 'Em repouso',
  AOS_ESFORCOS: 'Aos esforços',
  AO_RESPIRAR: 'Ao respirar',
};

const VALID = new Set<string>(DOR_PRESENTE_KEYS);

/** Parseia CSV gravado na triagem (`EM_REPOUSO,AO_RESPIRAR`). */
export function parseDorPresenteCsv(csv: string | null | undefined): DorPresenteKey[] {
  if (!csv?.trim()) return [];
  const out: DorPresenteKey[] = [];
  for (const part of csv.split(',')) {
    const k = part.trim().toUpperCase();
    if (VALID.has(k)) out.push(k as DorPresenteKey);
  }
  return out;
}

/** Serializa lista de chaves para CSV (`EM_REPOUSO,AOS_ESFORCOS`). */
export function serializeDorPresenteKeys(keys: DorPresenteKey[] | undefined | null): string {
  if (!keys || !Array.isArray(keys)) return '';
  return keys.filter((k) => VALID.has(k)).join(',');
}
