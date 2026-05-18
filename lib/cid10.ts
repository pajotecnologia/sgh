// lib/cid10.ts
// Base CID-10 simplificada para busca local (principais capítulos)
// Em produção, usar a base completa em JSON (~14k entradas) carregada do filesystem

export interface EntraCid10 {
  codigo: string;
  descricao: string;
  capitulo: string;
}

// Amostra dos CIDs mais frequentes no pronto-socorro brasileiro
export const CID10_BASE: EntraCid10[] = [
  // Doenças cardiovasculares
  { codigo: 'I10', descricao: 'Hipertensão essencial (primária)', capitulo: 'Circulatório' },
  { codigo: 'I20', descricao: 'Angina pectoris', capitulo: 'Circulatório' },
  { codigo: 'I21', descricao: 'Infarto agudo do miocárdio', capitulo: 'Circulatório' },
  { codigo: 'I26', descricao: 'Embolia pulmonar', capitulo: 'Circulatório' },
  { codigo: 'I50', descricao: 'Insuficiência cardíaca', capitulo: 'Circulatório' },
  { codigo: 'I63', descricao: 'Infarto cerebral', capitulo: 'Circulatório' },
  { codigo: 'I64', descricao: 'Acidente vascular cerebral não especificado', capitulo: 'Circulatório' },
  // Respiratório
  { codigo: 'J00', descricao: 'Nasofaringite aguda (resfriado comum)', capitulo: 'Respiratório' },
  { codigo: 'J06', descricao: 'Infecções agudas das vias aéreas superiores', capitulo: 'Respiratório' },
  { codigo: 'J18', descricao: 'Pneumonia por microrganismo não especificado', capitulo: 'Respiratório' },
  { codigo: 'J18.1', descricao: 'Pneumonia lobar', capitulo: 'Respiratório' },
  { codigo: 'J20', descricao: 'Bronquite aguda', capitulo: 'Respiratório' },
  { codigo: 'J45', descricao: 'Asma', capitulo: 'Respiratório' },
  { codigo: 'J44', descricao: 'DPOC — outras doenças pulmonares obstrutivas crónicas', capitulo: 'Respiratório' },
  // Digestivo
  { codigo: 'K25', descricao: 'Úlcera gástrica', capitulo: 'Digestivo' },
  { codigo: 'K29', descricao: 'Gastrite e duodenite', capitulo: 'Digestivo' },
  { codigo: 'K35', descricao: 'Apendicite aguda com peritonite generalizada', capitulo: 'Digestivo' },
  { codigo: 'K37', descricao: 'Apendicite aguda sem especificação', capitulo: 'Digestivo' },
  { codigo: 'K57', descricao: 'Doença diverticular do intestino', capitulo: 'Digestivo' },
  { codigo: 'K80', descricao: 'Colelitíase (cálculo biliar)', capitulo: 'Digestivo' },
  // Endócrino / Metabólico
  { codigo: 'E10', descricao: 'Diabetes mellitus insulinodependente', capitulo: 'Endócrino' },
  { codigo: 'E11', descricao: 'Diabetes mellitus não insulinodependente', capitulo: 'Endócrino' },
  { codigo: 'E66', descricao: 'Obesidade', capitulo: 'Endócrino' },
  { codigo: 'E87.1', descricao: 'Hiponatremia', capitulo: 'Endócrino' },
  // Neurológico
  { codigo: 'G43', descricao: 'Enxaqueca (migrânea)', capitulo: 'Neurológico' },
  { codigo: 'G40', descricao: 'Epilepsia', capitulo: 'Neurológico' },
  { codigo: 'R51', descricao: 'Cefaleia', capitulo: 'Sintomas' },
  // Infeccioso
  { codigo: 'A09', descricao: 'Diarréia e gastroenterite de origem infecciosa', capitulo: 'Infeccioso' },
  { codigo: 'A90', descricao: 'Dengue clássica (dengue fever)', capitulo: 'Infeccioso' },
  { codigo: 'A91', descricao: 'Dengue hemorrágica', capitulo: 'Infeccioso' },
  { codigo: 'B34.2', descricao: 'Infecção por coronavírus', capitulo: 'Infeccioso' },
  // Trauma / Externo
  { codigo: 'S00', descricao: 'Traumatismo superficial da cabeça', capitulo: 'Trauma' },
  { codigo: 'S09', descricao: 'Outros traumatismos da cabeça', capitulo: 'Trauma' },
  { codigo: 'S52', descricao: 'Fratura do antebraço', capitulo: 'Trauma' },
  { codigo: 'S72', descricao: 'Fratura do fêmur', capitulo: 'Trauma' },
  { codigo: 'T14', descricao: 'Traumatismo de região não especificada do corpo', capitulo: 'Trauma' },
  // Sintomas gerais
  { codigo: 'R00', descricao: 'Anormalidades dos batimentos cardíacos', capitulo: 'Sintomas' },
  { codigo: 'R05', descricao: 'Tosse', capitulo: 'Sintomas' },
  { codigo: 'R06', descricao: 'Anormalidades da respiração (dispnéia)', capitulo: 'Sintomas' },
  { codigo: 'R07', descricao: 'Dor no pescoço e no tórax', capitulo: 'Sintomas' },
  { codigo: 'R10', descricao: 'Dor abdominal e pélvica', capitulo: 'Sintomas' },
  { codigo: 'R50', descricao: 'Febre de origem desconhecida', capitulo: 'Sintomas' },
  { codigo: 'R55', descricao: 'Síncope e colapso', capitulo: 'Sintomas' },
  { codigo: 'R57', descricao: 'Choque não classificado em outra parte', capitulo: 'Sintomas' },
  // Urinário / Renal
  { codigo: 'N17', descricao: 'Insuficiência renal aguda', capitulo: 'Geniturinário' },
  { codigo: 'N18', descricao: 'Insuficiência renal crónica', capitulo: 'Geniturinário' },
  { codigo: 'N20', descricao: 'Cálculo do rim e do ureter (litíase renal)', capitulo: 'Geniturinário' },
  { codigo: 'N39.0', descricao: 'Infecção do trato urinário de localização não especificada', capitulo: 'Geniturinário' },
  // Saúde mental
  { codigo: 'F32', descricao: 'Episódios depressivos', capitulo: 'Mental' },
  { codigo: 'F41', descricao: 'Transtornos ansiosos', capitulo: 'Mental' },
  { codigo: 'F20', descricao: 'Esquizofrenia', capitulo: 'Mental' },
];

/**
 * Busca CIDs por código ou descrição (case-insensitive).
 * Retorna no máximo `limite` resultados.
 */
export function buscarCid10(query: string, limite = 15): EntraCid10[] {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim().toLowerCase();
  return CID10_BASE.filter(
    (c) =>
      c.codigo.toLowerCase().includes(q) ||
      c.descricao.toLowerCase().includes(q) ||
      c.capitulo.toLowerCase().includes(q)
  ).slice(0, limite);
}
