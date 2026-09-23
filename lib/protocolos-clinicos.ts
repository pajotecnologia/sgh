export interface SinaisVitaisEntrada {
  paSistolica?: number | null
  paDiastolica?: number | null
  frequenciaCardiaca?: number | null
  frequenciaResp?: number | null
  temperatura?: number | null
  spo2?: number | null
  glicemia?: number | null
  escalaGlasgow?: number | null
  inicioSintomasHoras?: number | null
}

export interface AlertaProtocolo {
  protocolo: 'SEPSE' | 'AVC' | 'DOR_TORACICA_IAM' | 'NENHUM'
  nivelAlerta: 'CRITICO' | 'ALTO' | 'MODERADO' | 'BAIXO'
  titulo: string
  criteriosAtendidos: string[]
  condutasImediatas: string[]
  janelaTempo?: string | null
}

/**
 * Avaliação automatizada de risco de SEPSE (qSOFA & SIRS)
 */
export function avaliarProtocoloSepse(sinais: SinaisVitaisEntrada, suspeitaInfeccao = true): AlertaProtocolo | null {
  const criterios: string[] = []
  let pontosQsofa = 0

  // Critérios qSOFA:
  // 1. Frequência respiratória >= 22 irpm
  if (sinais.frequenciaResp && sinais.frequenciaResp >= 22) {
    pontosQsofa++
    criterios.push(`FR elevada (${sinais.frequenciaResp} irpm >= 22)`)
  }

  // 2. Pressão arterial sistólica <= 100 mmHg
  if (sinais.paSistolica && sinais.paSistolica <= 100) {
    pontosQsofa++
    criterios.push(`Hipotensão arterial sistólica (${sinais.paSistolica} mmHg <= 100)`)
  }

  // 3. Rebaixamento de consciência / Glasgow < 15
  if (sinais.escalaGlasgow && sinais.escalaGlasgow < 15) {
    pontosQsofa++
    criterios.push(`Alteração neurológica (Glasgow ${sinais.escalaGlasgow} < 15)`)
  }

  // Critérios SIRS adicionais:
  if (sinais.temperatura && (sinais.temperatura > 38.0 || sinais.temperatura < 36.0)) {
    criterios.push(`Temperatura anormal (${sinais.temperatura} °C)`)
  }

  if (sinais.frequenciaCardiaca && sinais.frequenciaCardiaca > 90) {
    criterios.push(`Taquicardia (${sinais.frequenciaCardiaca} bpm > 90)`)
  }

  if (pontosQsofa >= 2 && suspeitaInfeccao) {
    return {
      protocolo: 'SEPSE',
      nivelAlerta: 'CRITICO',
      titulo: '⚠️ ALERTA: PROTOCOLO DE SEPSE PROVÁVEL (qSOFA >= 2)',
      criteriosAtendidos: criterios,
      condutasImediatas: [
        'Acionar médico assistente imediatamente',
        'Coletar 2 pares de hemoculturas antes do antibiótico',
        'Iniciar antibioticoterapia de amplo espectro na primeira hora ("Golden Hour")',
        'Medir lactato arterial ou venoso',
        'Iniciar ressuscitação volêmica (30 mL/kg de cristalóide se hipotensão ou lactato >= 4 mmol/L)',
      ],
      janelaTempo: 'Tempo para 1ª dose de antibiótico: <= 60 minutos',
    }
  }

  if ((pontosQsofa === 1 || criterios.length >= 2) && suspeitaInfeccao) {
    return {
      protocolo: 'SEPSE',
      nivelAlerta: 'ALTO',
      titulo: '⚠️ ATENÇÃO: Risco de Deterioração Infecciosa (SIRS / qSOFA 1)',
      criteriosAtendidos: criterios,
      condutasImediatas: [
        'Reavaliação médica prioritária',
        'Monitorização contínua de sinais vitais e oximetria',
        'Coleta de exames laboratoriais (hemograma, PCR, lactato, função renal)',
      ],
      janelaTempo: 'Reavaliação em 30 minutos',
    }
  }

  return null
}

/**
 * Avaliação automatizada de AVC Agudo (Escala de Cincinnati & Janela Trombolítica)
 */
export function avaliarProtocoloAvc(dados: {
  assimetriaFacial: boolean
  quedaBraco: boolean
  falaAnormal: boolean
  inicioSintomasHoras?: number | null
}): AlertaProtocolo | null {
  const alterados: string[] = []
  if (dados.assimetriaFacial) alterados.push('Desvio de rima / assimetria facial')
  if (dados.quedaBraco) alterados.push('Fraqueza motora / queda de membro superior')
  if (dados.falaAnormal) alterados.push('Fala arrastada / disartria / afasia')

  if (alterados.length === 0) return null

  const dentroJanela = dados.inicioSintomasHoras !== undefined && dados.inicioSintomasHoras !== null && dados.inicioSintomasHoras <= 4.5

  return {
    protocolo: 'AVC',
    nivelAlerta: dentroJanela ? 'CRITICO' : 'ALTO',
    titulo: dentroJanela
      ? '🚨 ALERTA VERMELHO: CÓDIGO AVC AGUDO NA JANELA TROMBOLÍTICA (<= 4.5h)'
      : '⚠️ ALERTA: SUSPEITA DE AVC (FORA DA JANELA OU TEMPO INDETERMINADO)',
    criteriosAtendidos: alterados,
    condutasImediatas: [
      'Encaminhar imediatamente para sala de emergência / TC crânio',
      'Tomografia de Crânio sem contraste imediata (Tempo Porta-TC <= 20 min)',
      'Glicemia capilar rápida (excluir hipoglicemia)',
      'Acesso venoso calibroso em membro não parético (evitar punção jugular/subclávia)',
      'Manter cabeceira a 0° ou 30° se risco de broncoaspiração',
      'Acionar neurologista / equipe de trombólise',
    ],
    janelaTempo: dentroJanela ? `Janela: ${dados.inicioSintomasHoras}h decorridas (Limite: 4.5h)` : 'Tempo indeterminado',
  }
}

/**
 * Avaliação automatizada de Dor Torácica / IAM
 */
export function avaliarProtocoloDorToracica(dados: {
  tipoDor: string // "Opressiva", "Queimação", "Pontada", "Precordial"
  irradiacao?: string[] // "BRACO_E", "MANDIBULA", "DORSO"
  tempoInicioMinutos?: number
  sudoreseOuNausea?: boolean
}): AlertaProtocolo | null {
  const suspeito =
    dados.tipoDor.toLowerCase().includes('opress') ||
    dados.tipoDor.toLowerCase().includes('precord') ||
    (dados.irradiacao && dados.irradiacao.length > 0) ||
    dados.sudoreseOuNausea

  if (!suspeito) return null

  return {
    protocolo: 'DOR_TORACICA_IAM',
    nivelAlerta: 'CRITICO',
    titulo: '❤️ ALERTA: PROTOCOLO DE DOR TORÁCICA / SUSPEITA DE SÍNDROME CORONARIANA AGUDA',
    criteriosAtendidos: [
      `Característica da dor: ${dados.tipoDor}`,
      ...(dados.irradiacao ? [`Irradiação: ${dados.irradiacao.join(', ')}`] : []),
      ...(dados.sudoreseOuNausea ? ['Sintomas autonômicos associados (sudorese/náusea)'] : []),
    ],
    condutasImediatas: [
      'Realizar ECG de 12 derivações em até 10 minutos (Tempo Porta-ECG <= 10 min)',
      'Ofertar Oxigênio se SpO2 < 90%',
      'Dupla antiagregação plaquetária (AAS mastigável + Clopidogrel/Ticagrelor) conforme prescrição médica',
      'Coleta de Marcadores de Necrose Miocárdica (Troponina I ou T ultrassensível)',
      'Monitorização cardíaca contínua e acesso venoso',
    ],
    janelaTempo: 'Tempo Porta-ECG obrigatório: <= 10 minutos',
  }
}
