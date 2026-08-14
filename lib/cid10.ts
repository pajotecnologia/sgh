// lib/cid10.ts
// Base de CIDs-10 abrangente e otimizada para pronto-socorro, ambulatório e internação hospitalar

export interface EntraCid10 {
  codigo: string;
  descricao: string;
  capitulo: string;
}

// Normaliza texto removendo acentos e caracteres especiais para busca fluida
export function normalizarTextoCid(texto: string): string {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/gi, '')
    .trim();
}

export const CID10_BASE: EntraCid10[] = [
  // 🫁 RESPIRATÓRIO (Capítulo X - J)
  { codigo: 'J00', descricao: 'Nasofaringite aguda (resfriado comum)', capitulo: 'Respiratório' },
  { codigo: 'J01', descricao: 'Sinusite aguda', capitulo: 'Respiratório' },
  { codigo: 'J02', descricao: 'Faringite aguda', capitulo: 'Respiratório' },
  { codigo: 'J03', descricao: 'Amigdalite aguda', capitulo: 'Respiratório' },
  { codigo: 'J04', descricao: 'Laringite e traqueíte agudas', capitulo: 'Respiratório' },
  { codigo: 'J05', descricao: 'Laringite obstrutiva aguda (crupe) e epiglotite', capitulo: 'Respiratório' },
  { codigo: 'J06', descricao: 'Infecções agudas das vias aéreas superiores de localizações múltiplas e não especificadas', capitulo: 'Respiratório' },
  { codigo: 'J10', descricao: 'Influenza (gripe) devida a vírus identificado', capitulo: 'Respiratório' },
  { codigo: 'J11', descricao: 'Influenza (gripe) devida a vírus não identificado', capitulo: 'Respiratório' },
  { codigo: 'J12', descricao: 'Pneumonia viral não classificada em outra parte', capitulo: 'Respiratório' },
  { codigo: 'J15', descricao: 'Pneumonia bacteriana não classificada em outra parte', capitulo: 'Respiratório' },
  { codigo: 'J18', descricao: 'Pneumonia por microrganismo não especificado', capitulo: 'Respiratório' },
  { codigo: 'J18.0', descricao: 'Broncopneumonia não especificada', capitulo: 'Respiratório' },
  { codigo: 'J18.1', descricao: 'Pneumonia lobar não especificada', capitulo: 'Respiratório' },
  { codigo: 'J20', descricao: 'Bronquite aguda', capitulo: 'Respiratório' },
  { codigo: 'J21', descricao: 'Bronquiolite aguda', capitulo: 'Respiratório' },
  { codigo: 'J30', descricao: 'Rinite alérgica e vasomotora', capitulo: 'Respiratório' },
  { codigo: 'J40', descricao: 'Bronquite não especificada como aguda ou crônica', capitulo: 'Respiratório' },
  { codigo: 'J44', descricao: 'DPOC — outras doenças pulmonares obstrutivas crônicas', capitulo: 'Respiratório' },
  { codigo: 'J45', descricao: 'Asma bronchial', capitulo: 'Respiratório' },
  { codigo: 'J45.0', descricao: 'Asma predominantemente alérgica', capitulo: 'Respiratório' },
  { codigo: 'J45.9', descricao: 'Asma não especificada (crise asmática)', capitulo: 'Respiratório' },
  { codigo: 'J46', descricao: 'Estado de mal asmático', capitulo: 'Respiratório' },
  { codigo: 'J90', descricao: 'Derrame pleural não classificado em outra parte', capitulo: 'Respiratório' },
  { codigo: 'J96', descricao: 'Insuficiência respiratória não classificada em outra parte', capitulo: 'Respiratório' },
  { codigo: 'J96.0', descricao: 'Insuficiência respiratória aguda', capitulo: 'Respiratório' },

  // ❤️ CIRCULATÓRIO & CARDIOVASCULAR (Capítulo IX - I)
  { codigo: 'I10', descricao: 'Hipertensão essencial (primária)', capitulo: 'Circulatório' },
  { codigo: 'I11', descricao: 'Doença cardíaca hipertensiva com insuficiência cardíaca', capitulo: 'Circulatório' },
  { codigo: 'I12', descricao: 'Doença renal hipertensiva', capitulo: 'Circulatório' },
  { codigo: 'I15', descricao: 'Hipertensão secundária (crise hipertensiva)', capitulo: 'Circulatório' },
  { codigo: 'I20', descricao: 'Angina pectoris', capitulo: 'Circulatório' },
  { codigo: 'I20.0', descricao: 'Angina instável', capitulo: 'Circulatório' },
  { codigo: 'I21', descricao: 'Infarto agudo do miocárdio (IAM)', capitulo: 'Circulatório' },
  { codigo: 'I21.9', descricao: 'Infarto agudo do miocárdio não especificado', capitulo: 'Circulatório' },
  { codigo: 'I26', descricao: 'Embolia pulmonar (TEP)', capitulo: 'Circulatório' },
  { codigo: 'I48', descricao: 'Fibrilação e flutter atrial', capitulo: 'Circulatório' },
  { codigo: 'I49', descricao: 'Outras arritmias cardíacas', capitulo: 'Circulatório' },
  { codigo: 'I50', descricao: 'Insuficiência cardíaca (ICC)', capitulo: 'Circulatório' },
  { codigo: 'I50.0', descricao: 'Insuficiência cardíaca congestiva', capitulo: 'Circulatório' },
  { codigo: 'I63', descricao: 'Infarto cerebral (AVC isquêmico)', capitulo: 'Circulatório' },
  { codigo: 'I64', descricao: 'Acidente vascular cerebral (AVC não especificado)', capitulo: 'Circulatório' },
  { codigo: 'I70', descricao: 'Aterosclerose', capitulo: 'Circulatório' },
  { codigo: 'I80', descricao: 'Flebite e tromboflebite (TVP)', capitulo: 'Circulatório' },
  { codigo: 'I83', descricao: 'Varizes dos membros inferiores', capitulo: 'Circulatório' },
  { codigo: 'I84', descricao: 'Hemorroidas', capitulo: 'Circulatório' },
  { codigo: 'I95', descricao: 'Hipotensão arterial', capitulo: 'Circulatório' },

  // 🤢 DIGESTIVO & GASTROENTEROLOGIA (Capítulo XI - K)
  { codigo: 'K21', descricao: 'Doença do refluxo gastroesofágico (DRGE)', capitulo: 'Digestivo' },
  { codigo: 'K25', descricao: 'Úlcera gástrica', capitulo: 'Digestivo' },
  { codigo: 'K26', descricao: 'Úlcera duodenal', capitulo: 'Digestivo' },
  { codigo: 'K29', descricao: 'Gastrite e duodenite', capitulo: 'Digestivo' },
  { codigo: 'K29.7', descricao: 'Gastrite não especificada', capitulo: 'Digestivo' },
  { codigo: 'K30', descricao: 'Dispepsia (indigestão)', capitulo: 'Digestivo' },
  { codigo: 'K35', descricao: 'Apendicite aguda', capitulo: 'Digestivo' },
  { codigo: 'K37', descricao: 'Apendicite não especificada', capitulo: 'Digestivo' },
  { codigo: 'K40', descricao: 'Hérnia inguinal', capitulo: 'Digestivo' },
  { codigo: 'K42', descricao: 'Hérnia umbilical', capitulo: 'Digestivo' },
  { codigo: 'K52', descricao: 'Gastroenterite e colite não infecciosas', capitulo: 'Digestivo' },
  { codigo: 'K56', descricao: 'Íleo paralítico e obstrução intestinal', capitulo: 'Digestivo' },
  { codigo: 'K57', descricao: 'Doença diverticular do intestino (diverticulite)', capitulo: 'Digestivo' },
  { codigo: 'K59.0', descricao: 'Constipação intestinal (prisão de ventre)', capitulo: 'Digestivo' },
  { codigo: 'K70', descricao: 'Doença alcoólica do fígado', capitulo: 'Digestivo' },
  { codigo: 'K80', descricao: 'Colelitíase (cálculo biliar/pedra na vesícula)', capitulo: 'Digestivo' },
  { codigo: 'K81', descricao: 'Colecistite aguda', capitulo: 'Digestivo' },
  { codigo: 'K85', descricao: 'Pancreatite aguda', capitulo: 'Digestivo' },
  { codigo: 'K92.0', descricao: 'Hematêmese (vômito com sangue)', capitulo: 'Digestivo' },
  { codigo: 'K92.1', descricao: 'Melena (sangue nas fezes)', capitulo: 'Digestivo' },
  { codigo: 'K92.2', descricao: 'Hemorragia digestiva não especificada', capitulo: 'Digestivo' },

  // 🩸 INFECCIOSAS & PARASITÁRIAS (Capítulo I - A/B)
  { codigo: 'A09', descricao: 'Diarreia e gastroenterite de origem infecciosa presumível', capitulo: 'Infeccioso' },
  { codigo: 'A41', descricao: 'Septicemia não especificada (sepse/infecção generalizada)', capitulo: 'Infeccioso' },
  { codigo: 'A41.9', descricao: 'Septicemia não especificada', capitulo: 'Infeccioso' },
  { codigo: 'A46', descricao: 'Erisipela', capitulo: 'Infeccioso' },
  { codigo: 'A49', descricao: 'Infecção bacteriana de localização não especificada', capitulo: 'Infeccioso' },
  { codigo: 'A90', descricao: 'Dengue clássica', capitulo: 'Infeccioso' },
  { codigo: 'A91', descricao: 'Dengue hemorrágica', capitulo: 'Infeccioso' },
  { codigo: 'B01', descricao: 'Varicela (catapora)', capitulo: 'Infeccioso' },
  { codigo: 'B02', descricao: 'Herpes zoster (cobreiro)', capitulo: 'Infeccioso' },
  { codigo: 'B34.2', descricao: 'Infecção por coronavírus (COVID-19)', capitulo: 'Infeccioso' },
  { codigo: 'B35', descricao: 'Dermatofitose (micose de pele/pé de atleta)', capitulo: 'Infeccioso' },
  { codigo: 'B37', descricao: 'Candidíase', capitulo: 'Infeccioso' },
  { codigo: 'B86', descricao: 'Escabiose (sarna)', capitulo: 'Infeccioso' },

  // 🧠 NEUROLOGIA, DOR & SINTOMAS GERAIS (Capítulos VI e XVIII - G/R)
  { codigo: 'G40', descricao: 'Epilepsia', capitulo: 'Neurológico' },
  { codigo: 'G43', descricao: 'Enxaqueca (migrânea)', capitulo: 'Neurológico' },
  { codigo: 'G44', descricao: 'Outras síndromes de cefaleia (cefaleia tensional)', capitulo: 'Neurológico' },
  { codigo: 'G45', descricao: 'Ataques isquêmicos transitórios (AIT)', capitulo: 'Neurológico' },
  { codigo: 'H65', descricao: 'Otite média não supurativa (otite serosa)', capitulo: 'Sintomas' },
  { codigo: 'H66', descricao: 'Otite média supurativa e a não especificada (otite aguda)', capitulo: 'Sintomas' },
  { codigo: 'H10', descricao: 'Conjuntivite', capitulo: 'Sintomas' },
  { codigo: 'R00', descricao: 'Anormalidades dos batimentos cardíacos (palpitações)', capitulo: 'Sintomas' },
  { codigo: 'R05', descricao: 'Tosse', capitulo: 'Sintomas' },
  { codigo: 'R06.0', descricao: 'Dispneia (falta de ar)', capitulo: 'Sintomas' },
  { codigo: 'R07.0', descricao: 'Dor de garganta', capitulo: 'Sintomas' },
  { codigo: 'R07.2', descricao: 'Dor precordial (dor no peito)', capitulo: 'Sintomas' },
  { codigo: 'R07.4', descricao: 'Dor torácica não especificada', capitulo: 'Sintomas' },
  { codigo: 'R10.0', descricao: 'Abdome agudo', capitulo: 'Sintomas' },
  { codigo: 'R10.4', descricao: 'Outras dores abdominais e as não especificadas', capitulo: 'Sintomas' },
  { codigo: 'R11', descricao: 'Náusea e vômitos', capitulo: 'Sintomas' },
  { codigo: 'R42', descricao: 'Tontura e instabilidade (vertigem/labirintite)', capitulo: 'Sintomas' },
  { codigo: 'R50', descricao: 'Febre de origem desconhecida', capitulo: 'Sintomas' },
  { codigo: 'R50.9', descricao: 'Febre não especificada', capitulo: 'Sintomas' },
  { codigo: 'R51', descricao: 'Cefaleia (dor de cabeça)', capitulo: 'Sintomas' },
  { codigo: 'R52', descricao: 'Dor não classificada em outra parte', capitulo: 'Sintomas' },
  { codigo: 'R53', descricao: 'Mal-estar e fadiga (astenia/fraqueza)', capitulo: 'Sintomas' },
  { codigo: 'R55', descricao: 'Síncope e colapso (desmaio)', capitulo: 'Sintomas' },
  { codigo: 'R56', descricao: 'Convulsões não classificadas em outra parte', capitulo: 'Sintomas' },

  // 🚽 RENAL, GENITURINÁRIO & UROLOGIA (Capítulo XIV - N)
  { codigo: 'N10', descricao: 'Nefrite tubulointersticial aguda (pielonefrite aguda)', capitulo: 'Geniturinário' },
  { codigo: 'N17', descricao: 'Insuficiência renal aguda (IRA)', capitulo: 'Geniturinário' },
  { codigo: 'N18', descricao: 'Insuficiência renal crônica (IRC)', capitulo: 'Geniturinário' },
  { codigo: 'N20', descricao: 'Cálculo do rim e do ureter (litíase renal / pedra no rim)', capitulo: 'Geniturinário' },
  { codigo: 'N23', descricao: 'Cólica nefrética não especificada (cólica de rim)', capitulo: 'Geniturinário' },
  { codigo: 'N30', descricao: 'Cistite aguda', capitulo: 'Geniturinário' },
  { codigo: 'N39.0', descricao: 'Infecção do trato urinário de localização não especificada (ITU)', capitulo: 'Geniturinário' },
  { codigo: 'N40', descricao: 'Hiperplasia da próstata (HPB)', capitulo: 'Geniturinário' },
  { codigo: 'N76', descricao: 'Outras inflamações da vagina e da vulva (vulvovaginite)', capitulo: 'Geniturinário' },

  // 🦴 MUSCULOESQUELÉTICO, ORTOPEDIA & TRAUMA (Capítulos XIII e XIX - M/S/T)
  { codigo: 'M13', descricao: 'Outras artrites', capitulo: 'Trauma' },
  { codigo: 'M25.5', descricao: 'Dor articular (artralgia)', capitulo: 'Trauma' },
  { codigo: 'M54', descricao: 'Dorsalgia', capitulo: 'Trauma' },
  { codigo: 'M54.2', descricao: 'Cervicalgia (dor no pescoço)', capitulo: 'Trauma' },
  { codigo: 'M54.5', descricao: 'Lombalgia não especificada (dor lombar)', capitulo: 'Trauma' },
  { codigo: 'M54.4', descricao: 'Lumbago com ciática (dor ciática)', capitulo: 'Trauma' },
  { codigo: 'M65', descricao: 'Sinovite e tenossenovite (tendinite)', capitulo: 'Trauma' },
  { codigo: 'M79.1', descricao: 'Mialgia (dor muscular)', capitulo: 'Trauma' },
  { codigo: 'M79.7', descricao: 'Fibromialgia', capitulo: 'Trauma' },
  { codigo: 'S00', descricao: 'Traumatismo superficial da cabeça', capitulo: 'Trauma' },
  { codigo: 'S01', descricao: 'Ferimento da cabeça (corte/laceração)', capitulo: 'Trauma' },
  { codigo: 'S06', descricao: 'Traumatismo intracraniano (TCE)', capitulo: 'Trauma' },
  { codigo: 'S42', descricao: 'Fratura da clavícula/ombro', capitulo: 'Trauma' },
  { codigo: 'S52', descricao: 'Fratura do antebraço (rádio/ulna)', capitulo: 'Trauma' },
  { codigo: 'S62', descricao: 'Fratura ao nível do punho e da mão', capitulo: 'Trauma' },
  { codigo: 'S72', descricao: 'Fratura do fêmur', capitulo: 'Trauma' },
  { codigo: 'S82', descricao: 'Fratura da perna, incluindo tornozelo', capitulo: 'Trauma' },
  { codigo: 'S93', descricao: 'Entorse e luxação do tornozelo e do pé', capitulo: 'Trauma' },
  { codigo: 'T14', descricao: 'Traumatismo de região não especificada do corpo', capitulo: 'Trauma' },
  { codigo: 'T30', descricao: 'Queimadura de região não especificada', capitulo: 'Trauma' },
  { codigo: 'T78.4', descricao: 'Alergia não especificada (reação alérgica/urticária)', capitulo: 'Trauma' },
  { codigo: 'T78.2', descricao: 'Choque anafilático não especificado', capitulo: 'Trauma' },

  // 🧪 ENDÓCRINO, METABÓLICO & NUTRIÇÃO (Capítulo IV - E)
  { codigo: 'E10', descricao: 'Diabetes mellitus tipo 1 (insulinodependente)', capitulo: 'Endócrino' },
  { codigo: 'E11', descricao: 'Diabetes mellitus tipo 2 (não insulinodependente)', capitulo: 'Endócrino' },
  { codigo: 'E14', descricao: 'Diabetes mellitus não especificado (hiperglicemia)', capitulo: 'Endócrino' },
  { codigo: 'E14.0', descricao: 'Diabetes mellitus com cetoacidose', capitulo: 'Endócrino' },
  { codigo: 'E16.2', descricao: 'Hipoglicemia não especificada', capitulo: 'Endócrino' },
  { codigo: 'E66', descricao: 'Obesidade', capitulo: 'Endócrino' },
  { codigo: 'E86', descricao: 'Depleção de volume (desidratação)', capitulo: 'Endócrino' },
  { codigo: 'E87.1', descricao: 'Hiponatremia (sódio baixo)', capitulo: 'Endócrino' },
  { codigo: 'E87.6', descricao: 'Hipopotassemia (potássio baixo)', capitulo: 'Endócrino' },

  // 🤰 OBSTETRÍCIA, GINECOLOGIA & PERINATAL (Capítulos XIV, XV, XVI - O/P/Z)
  { codigo: 'O03', descricao: 'Aborto espontâneo', capitulo: 'Obstetrícia' },
  { codigo: 'O13', descricao: 'Hipertensão gestacional sem de proteinúria significativa', capitulo: 'Obstetrícia' },
  { codigo: 'O14', descricao: 'Pré-eclâmpsia gestacional', capitulo: 'Obstetrícia' },
  { codigo: 'O15', descricao: 'Eclâmpsia', capitulo: 'Obstetrícia' },
  { codigo: 'O20', descricao: 'Hemorragia do início da gravidez (ameaça de aborto)', capitulo: 'Obstetrícia' },
  { codigo: 'O24', descricao: 'Diabetes mellitus na gravidez (gestacional)', capitulo: 'Obstetrícia' },
  { codigo: 'O42', descricao: 'Ruptura prematura de membranas (bolsa rota)', capitulo: 'Obstetrícia' },
  { codigo: 'O47', descricao: 'Falso trabalho de parto', capitulo: 'Obstetrícia' },
  { codigo: 'O60', descricao: 'Trabalho de parto pré-termo (prematuro)', capitulo: 'Obstetrícia' },
  { codigo: 'O80', descricao: 'Parto único espontâneo (parto normal)', capitulo: 'Obstetrícia' },
  { codigo: 'O82', descricao: 'Parto único por cesariana (parto cesáreo)', capitulo: 'Obstetrícia' },
  { codigo: 'O72', descricao: 'Hemorragia pós-parto', capitulo: 'Obstetrícia' },
  { codigo: 'P07', descricao: 'Prematuridade e baixo peso ao nascer', capitulo: 'Perinatal' },
  { codigo: 'P22', descricao: 'Desconforto respiratório do recém-nascido', capitulo: 'Perinatal' },
  { codigo: 'P59', descricao: 'Icterícia neonatal (amarelão)', capitulo: 'Perinatal' },
  { codigo: 'Z34', descricao: 'Supervisão de gravidez normal (pré-natal)', capitulo: 'Obstetrícia' },
  { codigo: 'Z38', descricao: 'Recém-nascido (nascimento no hospital)', capitulo: 'Perinatal' },

  // 🧠 SAÚDE MENTAL & PSIQUIATRIA (Capítulo V - F)
  { codigo: 'F10', descricao: 'Transtornos mentais e de comportamento devidos ao uso de álcool (embriaguez/abstinência)', capitulo: 'Mental' },
  { codigo: 'F19', descricao: 'Transtornos mentais devidos ao uso de múltiplas drogas', capitulo: 'Mental' },
  { codigo: 'F20', descricao: 'Esquizofrenia', capitulo: 'Mental' },
  { codigo: 'F32', descricao: 'Episódio depressivo', capitulo: 'Mental' },
  { codigo: 'F41.0', descricao: 'Transtorno de pânico (crise de pânico)', capitulo: 'Mental' },
  { codigo: 'F41.1', descricao: 'Transtorno de ansiedade generalizada (TAG / crise de ansiedade)', capitulo: 'Mental' },
  { codigo: 'F43', descricao: 'Reações ao estresse grave e transtornos de adaptação', capitulo: 'Mental' },
];

/**
 * Busca CIDs por código ou descrição com algoritmo de ranking inteligente e insensível a acentos.
 */
export function buscarCid10(query: string, limite = 20): EntraCid10[] {
  if (!query || !query.trim()) {
    // Retorna os mais frequentes por padrão se nada for digitado
    return CID10_BASE.slice(0, limite);
  }

  const qNorm = normalizarTextoCid(query);
  if (!qNorm) return CID10_BASE.slice(0, limite);

  // Sistema de pontuação / ranking
  const resultadosComScore = CID10_BASE.map((cid) => {
    const codNorm = normalizarTextoCid(cid.codigo);
    const descNorm = normalizarTextoCid(cid.descricao);
    const capNorm = normalizarTextoCid(cid.capitulo);

    let score = 0;

    // 1. Código exato -> Prioridade Máxima
    if (codNorm === qNorm) {
      score += 1000;
    }
    // 2. Código começa com a busca -> Prioridade Alta
    else if (codNorm.startsWith(qNorm)) {
      score += 500;
    }
    // 3. Código contém a busca
    else if (codNorm.includes(qNorm)) {
      score += 300;
    }

    // 4. Descrição começa com a busca
    if (descNorm.startsWith(qNorm)) {
      score += 400;
    }
    // 5. Palavras da descrição começam com a busca
    else {
      const palavras = descNorm.split(' ');
      if (palavras.some((p) => p.startsWith(qNorm))) {
        score += 200;
      } else if (descNorm.includes(qNorm)) {
        score += 100;
      }
    }

    // 6. Capítulo corresponde
    if (capNorm.includes(qNorm)) {
      score += 50;
    }

    return { cid, score };
  });

  return resultadosComScore
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.cid)
    .slice(0, limite);
}
