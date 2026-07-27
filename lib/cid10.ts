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
  { codigo: 'I11', descricao: 'Doença cardíaca hipertensiva', capitulo: 'Circulatório' },
  { codigo: 'I20', descricao: 'Angina pectoris', capitulo: 'Circulatório' },
  { codigo: 'I21', descricao: 'Infarto agudo do miocárdio', capitulo: 'Circulatório' },
  { codigo: 'I26', descricao: 'Embolia pulmonar', capitulo: 'Circulatório' },
  { codigo: 'I48', descricao: 'Fibrilação e flutter atrial', capitulo: 'Circulatório' },
  { codigo: 'I50', descricao: 'Insuficiência cardíaca', capitulo: 'Circulatório' },
  { codigo: 'I63', descricao: 'Infarto cerebral', capitulo: 'Circulatório' },
  { codigo: 'I64', descricao: 'Acidente vascular cerebral não especificado', capitulo: 'Circulatório' },
  { codigo: 'I80', descricao: 'Flebite e tromboflebite', capitulo: 'Circulatório' },
  // Respiratório
  { codigo: 'J00', descricao: 'Nasofaringite aguda (resfriado comum)', capitulo: 'Respiratório' },
  { codigo: 'J06', descricao: 'Infecções agudas das vias aéreas superiores', capitulo: 'Respiratório' },
  { codigo: 'J15', descricao: 'Pneumonia bacteriana não classificada em outra parte', capitulo: 'Respiratório' },
  { codigo: 'J18', descricao: 'Pneumonia por microrganismo não especificado', capitulo: 'Respiratório' },
  { codigo: 'J18.1', descricao: 'Pneumonia lobar', capitulo: 'Respiratório' },
  { codigo: 'J20', descricao: 'Bronquite aguda', capitulo: 'Respiratório' },
  { codigo: 'J21', descricao: 'Bronquiolite aguda', capitulo: 'Respiratório' },
  { codigo: 'J45', descricao: 'Asma', capitulo: 'Respiratório' },
  { codigo: 'J44', descricao: 'DPOC — outras doenças pulmonares obstrutivas crónicas', capitulo: 'Respiratório' },
  { codigo: 'J96', descricao: 'Insuficiência respiratória não classificada em outra parte', capitulo: 'Respiratório' },
  // Digestivo
  { codigo: 'K25', descricao: 'Úlcera gástrica', capitulo: 'Digestivo' },
  { codigo: 'K29', descricao: 'Gastrite e duodenite', capitulo: 'Digestivo' },
  { codigo: 'K35', descricao: 'Apendicite aguda com peritonite generalizada', capitulo: 'Digestivo' },
  { codigo: 'K37', descricao: 'Apendicite aguda sem especificação', capitulo: 'Digestivo' },
  { codigo: 'K52', descricao: 'Gastroenterite e colite não infecciosas', capitulo: 'Digestivo' },
  { codigo: 'K57', descricao: 'Doença diverticular do intestino', capitulo: 'Digestivo' },
  { codigo: 'K80', descricao: 'Colelitíase (cálculo biliar)', capitulo: 'Digestivo' },
  { codigo: 'K81', descricao: 'Colecistite', capitulo: 'Digestivo' },
  { codigo: 'K92', descricao: 'Outras doenças do aparelho digestivo (HDA/HDB)', capitulo: 'Digestivo' },
  // Endócrino / Metabólico
  { codigo: 'E10', descricao: 'Diabetes mellitus insulinodependente', capitulo: 'Endócrino' },
  { codigo: 'E11', descricao: 'Diabetes mellitus não insulinodependente', capitulo: 'Endócrino' },
  { codigo: 'E14', descricao: 'Diabetes mellitus não especificado', capitulo: 'Endócrino' },
  { codigo: 'E66', descricao: 'Obesidade', capitulo: 'Endócrino' },
  { codigo: 'E86', descricao: 'Depleção de volume (desidratação)', capitulo: 'Endócrino' },
  { codigo: 'E87.1', descricao: 'Hiponatremia', capitulo: 'Endócrino' },
  { codigo: 'E87.6', descricao: 'Hipopotassemia', capitulo: 'Endócrino' },
  // Neurológico
  { codigo: 'G43', descricao: 'Enxaqueca (migrânea)', capitulo: 'Neurológico' },
  { codigo: 'G40', descricao: 'Epilepsia', capitulo: 'Neurológico' },
  { codigo: 'G41', descricao: 'Estado de mal epiléptico', capitulo: 'Neurológico' },
  { codigo: 'R51', descricao: 'Cefaleia', capitulo: 'Sintomas' },
  // Infeccioso
  { codigo: 'A09', descricao: 'Diarréia e gastroenterite de origem infecciosa', capitulo: 'Infeccioso' },
  { codigo: 'A41', descricao: 'Septicemia (sepse)', capitulo: 'Infeccioso' },
  { codigo: 'A90', descricao: 'Dengue clássica (dengue fever)', capitulo: 'Infeccioso' },
  { codigo: 'A91', descricao: 'Dengue hemorrágica', capitulo: 'Infeccioso' },
  { codigo: 'B34.2', descricao: 'Infecção por coronavírus', capitulo: 'Infeccioso' },
  // Trauma / Externo
  { codigo: 'S00', descricao: 'Traumatismo superficial da cabeça', capitulo: 'Trauma' },
  { codigo: 'S06', descricao: 'Traumatismo intracraniano', capitulo: 'Trauma' },
  { codigo: 'S09', descricao: 'Outros traumatismos da cabeça', capitulo: 'Trauma' },
  { codigo: 'S52', descricao: 'Fratura do antebraço', capitulo: 'Trauma' },
  { codigo: 'S72', descricao: 'Fratura do fêmur', capitulo: 'Trauma' },
  { codigo: 'S82', descricao: 'Fratura da perna, incluindo tornozelo', capitulo: 'Trauma' },
  { codigo: 'T14', descricao: 'Traumatismo de região não especificada do corpo', capitulo: 'Trauma' },
  { codigo: 'T78', descricao: 'Efeitos adversos não classificados (alergia/anafilaxia)', capitulo: 'Trauma' },
  // Sintomas gerais
  { codigo: 'R00', descricao: 'Anormalidades dos batimentos cardíacos', capitulo: 'Sintomas' },
  { codigo: 'R05', descricao: 'Tosse', capitulo: 'Sintomas' },
  { codigo: 'R06', descricao: 'Anormalidades da respiração (dispnéia)', capitulo: 'Sintomas' },
  { codigo: 'R07', descricao: 'Dor no pescoço e no tórax', capitulo: 'Sintomas' },
  { codigo: 'R10', descricao: 'Dor abdominal e pélvica', capitulo: 'Sintomas' },
  { codigo: 'R11', descricao: 'Náusea e vômitos', capitulo: 'Sintomas' },
  { codigo: 'R42', descricao: 'Tontura e instabilidade', capitulo: 'Sintomas' },
  { codigo: 'R50', descricao: 'Febre de origem desconhecida', capitulo: 'Sintomas' },
  { codigo: 'R55', descricao: 'Síncope e colapso', capitulo: 'Sintomas' },
  { codigo: 'R56', descricao: 'Convulsões não classificadas em outra parte', capitulo: 'Sintomas' },
  { codigo: 'R57', descricao: 'Choque não classificado em outra parte', capitulo: 'Sintomas' },
  // Urinário / Renal
  { codigo: 'N17', descricao: 'Insuficiência renal aguda', capitulo: 'Geniturinário' },
  { codigo: 'N18', descricao: 'Insuficiência renal crónica', capitulo: 'Geniturinário' },
  { codigo: 'N20', descricao: 'Cálculo do rim e do ureter (litíase renal)', capitulo: 'Geniturinário' },
  { codigo: 'N23', descricao: 'Cólica nefrética não especificada', capitulo: 'Geniturinário' },
  { codigo: 'N39.0', descricao: 'Infecção do trato urinário de localização não especificada', capitulo: 'Geniturinário' },
  // Saúde mental
  { codigo: 'F32', descricao: 'Episódios depressivos', capitulo: 'Mental' },
  { codigo: 'F41', descricao: 'Transtornos ansiosos', capitulo: 'Mental' },
  { codigo: 'F20', descricao: 'Esquizofrenia', capitulo: 'Mental' },
  { codigo: 'F10', descricao: 'Transtornos mentais devido ao uso de álcool', capitulo: 'Mental' },
  // Gravidez, parto e puerpério (obstetrícia)
  { codigo: 'O80', descricao: 'Parto único espontâneo', capitulo: 'Obstetrícia' },
  { codigo: 'O82', descricao: 'Parto único por cesariana', capitulo: 'Obstetrícia' },
  { codigo: 'O48', descricao: 'Gravidez prolongada', capitulo: 'Obstetrícia' },
  { codigo: 'O14', descricao: 'Pré-eclâmpsia', capitulo: 'Obstetrícia' },
  { codigo: 'O15', descricao: 'Eclâmpsia', capitulo: 'Obstetrícia' },
  { codigo: 'O13', descricao: 'Hipertensão gestacional', capitulo: 'Obstetrícia' },
  { codigo: 'O24', descricao: 'Diabetes mellitus na gravidez', capitulo: 'Obstetrícia' },
  { codigo: 'O03', descricao: 'Aborto espontâneo', capitulo: 'Obstetrícia' },
  { codigo: 'O06', descricao: 'Aborto não especificado', capitulo: 'Obstetrícia' },
  { codigo: 'O20', descricao: 'Hemorragia do início da gravidez', capitulo: 'Obstetrícia' },
  { codigo: 'O42', descricao: 'Ruptura prematura de membranas', capitulo: 'Obstetrícia' },
  { codigo: 'O47', descricao: 'Falso trabalho de parto', capitulo: 'Obstetrícia' },
  { codigo: 'O60', descricao: 'Trabalho de parto pré-termo', capitulo: 'Obstetrícia' },
  { codigo: 'O72', descricao: 'Hemorragia pós-parto', capitulo: 'Obstetrícia' },
  { codigo: 'O85', descricao: 'Infecção puerperal (sepse puerperal)', capitulo: 'Obstetrícia' },
  { codigo: 'O90', descricao: 'Complicações do puerpério não classificadas', capitulo: 'Obstetrícia' },
  { codigo: 'Z34', descricao: 'Supervisão de gravidez normal', capitulo: 'Obstetrícia' },
  { codigo: 'Z39', descricao: 'Assistência e exame pós-parto', capitulo: 'Obstetrícia' },
  // Recém-nascido / perinatal
  { codigo: 'P07', descricao: 'Transtornos relacionados à gestação curta e baixo peso', capitulo: 'Perinatal' },
  { codigo: 'P21', descricao: 'Asfixia ao nascer', capitulo: 'Perinatal' },
  { codigo: 'P22', descricao: 'Desconforto respiratório do recém-nascido', capitulo: 'Perinatal' },
  { codigo: 'P36', descricao: 'Septicemia bacteriana do recém-nascido', capitulo: 'Perinatal' },
  { codigo: 'P59', descricao: 'Icterícia neonatal', capitulo: 'Perinatal' },
  { codigo: 'Z38', descricao: 'Recém-nascido (conforme local de nascimento)', capitulo: 'Perinatal' },
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
