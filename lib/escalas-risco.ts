export interface EscalaBradenInput {
  percepcaoSensorial: 1 | 2 | 3 | 4 // 1=Totalmente limitado, 4=Nenhuma limitação
  umidade: 1 | 2 | 3 | 4 // 1=Completamente molhado, 4=Raramente molhado
  atividade: 1 | 2 | 3 | 4 // 1=Acamado, 4=Deambula frequentemente
  mobilidade: 1 | 2 | 3 | 4 // 1=Completamente imóvel, 4=Sem limitações
  nutricao: 1 | 2 | 3 | 4 // 1=Muito pobre, 4=Excelente
  friccaoCisalhamento: 1 | 2 | 3 // 1=Problema, 3=Nenhum problema aparente
}

export interface EscalaMorseInput {
  historicoQuedas: boolean // 25 pts se sim
  diagnosticoSecundario: boolean // 15 pts se sim
  auxilioDeambulacao: 'NENHUM_ACAMADO' | 'MULETAS_BENGALA_ANDADOR' | 'MOBILIARIO' // 0, 15, 30 pts
  terapiaEndovenosa: boolean // 20 pts se sim (acesso venoso ou heparinização)
  marcha: 'NORMAL_ACAMADO' | 'FRACA' | 'COMPROMETIDA' // 0, 10, 20 pts
  estadoMental: 'ORIENTADO' | 'SUPERESTIMA_CAPACIDADE' // 0, 15 pts
}

export interface PassagemPlantaoSbar {
  atendimentoId: string
  pacienteNome: string
  leito: string
  situation: string // Situação clínica atual imediata
  background: string // Histórico de internação, cirurgias e comorbidades
  assessment: string // Avaliação dos sinais vitais, balanço e dispositivos
  recommendation: string // Recomendações e pendências para o próximo plantão
  passadoPor: string
  recebidoPor?: string
  dataHora: string
}

export interface PulseiraIdentificacaoPaciente {
  pacienteId: string
  atendimentoId: string
  numeroAtendimento: string
  nomeCompleto: string
  nomeMae?: string | null
  dataNascimento: string
  idadeAnos: number | null
  sexo: string
  tipoSanguineo: string
  alergias: string[]
  codigoBarrasValor: string
  qrCodeUrl: string
  geradoEm: string
}

export function calcularEscalaBraden(input: EscalaBradenInput): {
  pontos: number
  risco: 'MUITO_ALTO' | 'ALTO' | 'MODERADO' | 'BAIXO_SEM_RISCO'
  recomendacoes: string[]
} {
  const pontos =
    input.percepcaoSensorial +
    input.umidade +
    input.atividade +
    input.mobilidade +
    input.nutricao +
    input.friccaoCisalhamento

  let risco: 'MUITO_ALTO' | 'ALTO' | 'MODERADO' | 'BAIXO_SEM_RISCO' = 'BAIXO_SEM_RISCO'
  const recomendacoes: string[] = []

  if (pontos <= 9) {
    risco = 'MUITO_ALTO'
    recomendacoes.push(
      'Mudança de decúbito estrita a cada 2 horas',
      'Uso mandatório de colchão pneumático / piramidal',
      'Aplicação de ácidos graxos essenciais (AGE) em proeminências ósseas',
      'Proteção com placas hidrocolóides ou espuma de poliuretano em região sacra e calcâneos',
      'Avaliação da equipe de nutrição para suporte proteico'
    )
  } else if (pontos <= 12) {
    risco = 'ALTO'
    recomendacoes.push(
      'Mudança de decúbito a cada 2 horas',
      'Hidratação intensa da pele com AGE',
      'Coxins de alívio de pressão sob calcâneos'
    )
  } else if (pontos <= 14) {
    risco = 'MODERADO'
    recomendacoes.push('Estímulo à mobilização e reposicionamento regular', 'Controle rigoroso de umidade')
  } else {
    risco = 'BAIXO_SEM_RISCO'
    recomendacoes.push('Manter cuidados habituais de higiene e hidratação')
  }

  return { pontos, risco, recomendacoes }
}

export function calcularEscalaMorse(input: EscalaMorseInput): {
  pontos: number
  risco: 'ALTO' | 'MEDIO' | 'BAIXO'
  recomendacoes: string[]
} {
  let pontos = 0
  if (input.historicoQuedas) pontos += 25
  if (input.diagnosticoSecundario) pontos += 15
  if (input.auxilioDeambulacao === 'MULETAS_BENGALA_ANDADOR') pontos += 15
  if (input.auxilioDeambulacao === 'MOBILIARIO') pontos += 30
  if (input.terapiaEndovenosa) pontos += 20
  if (input.marcha === 'FRACA') pontos += 10
  if (input.marcha === 'COMPROMETIDA') pontos += 20
  if (input.estadoMental === 'SUPERESTIMA_CAPACIDADE') pontos += 15

  let risco: 'ALTO' | 'MEDIO' | 'BAIXO' = 'BAIXO'
  const recomendacoes: string[] = []

  if (pontos >= 45) {
    risco = 'ALTO'
    recomendacoes.push(
      'Grade bilateral do leito elevada continuamente',
      'Identificação visual de Risco de Queda (pulseira amarela / placa no leito)',
      'Acompanhamento obrigatório da enfermagem durante locomoção/banho',
      'Campainha de chamada ao alcance do paciente',
      'Orientação expressa ao paciente e familiares sobre não levantar sozinho'
    )
  } else if (pontos >= 25) {
    risco = 'MEDIO'
    recomendacoes.push('Manter grades do leito elevadas', 'Auxílio durante locomoção')
  } else {
    risco = 'BAIXO'
    recomendacoes.push('Cuidados de rotina')
  }

  return { pontos, risco, recomendacoes }
}

export function gerarDadosPulseiraPaciente(dados: {
  pacienteId: string
  atendimentoId: string
  numeroAtendimento: string
  nomeCompleto: string
  nomeMae?: string | null
  dataNascimento: Date
  sexo: string
  tipoSanguineo: string
  alergias?: string[]
  baseUrl?: string
}): PulseiraIdentificacaoPaciente {
  const baseUrl = dados.baseUrl || 'https://sgh.hospital.gov.br'
  const hoje = new Date()
  let idade = hoje.getFullYear() - dados.dataNascimento.getFullYear()
  const m = hoje.getMonth() - dados.dataNascimento.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < dados.dataNascimento.getDate())) {
    idade--
  }

  // Código de barras no formato do número do atendimento
  const codigoBarrasValor = dados.numeroAtendimento.replace(/[^a-zA-Z0-9]/g, '')
  const qrCodeUrl = `${baseUrl}/beira-leito/conferencia?atendimento=${dados.atendimentoId}&paciente=${dados.pacienteId}`

  return {
    pacienteId: dados.pacienteId,
    atendimentoId: dados.atendimentoId,
    numeroAtendimento: dados.numeroAtendimento,
    nomeCompleto: dados.nomeCompleto,
    nomeMae: dados.nomeMae ?? null,
    dataNascimento: dados.dataNascimento.toISOString().split('T')[0],
    idadeAnos: idade,
    sexo: dados.sexo,
    tipoSanguineo: dados.tipoSanguineo,
    alergias: dados.alergias ?? [],
    codigoBarrasValor,
    qrCodeUrl,
    geradoEm: new Date().toISOString(),
  }
}
