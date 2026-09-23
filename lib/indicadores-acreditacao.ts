export interface IndicadoresAcreditacaoHospitalar {
  periodoInicio: string
  periodoFim: string

  // 1. Ocupação e Movimentação
  totalLeitosOperacionais: number
  totalPacientesDia: number
  mediaPermanenciaDias: number // MP = Pacientes-Dia / Total Saídas (Altas + Óbitos)
  taxaOcupacaoPercentual: number // (Pacientes-Dia / (Leitos * Dias do Período)) * 100
  intervaloSubstituicaoDias: number // Giro de leito: ((Leitos * Dias) - Pacientes-Dia) / Total Saídas

  // 2. Segurança e CCIH / IRAS
  totalInfeccoesHospitalares: number
  densidadeInfeccaoPorMilPacientesDia: number // (Infecções / Pacientes-Dia) * 1000
  taxaConformidadeHigieneMaosPercentual: number

  // 3. Eficiência e Desfecho Clínico
  totalAltas: number
  totalObitos: number
  taxaMortalidadeInstitucionalPercentual: number // (Óbitos / Total Saídas) * 100
  taxaReadmissao30DiasPercentual: number // Readmissões em até 30 dias pela mesma causa
}

export function calcularIndicadoresAcreditacao(dados: {
  leitosOperacionais: number
  diasPeriodo: number
  pacientesDia: number
  altas: number
  obitos: number
  infeccoesIras: number
  readmissoes30d: number
  checagensHigieneMaosRealizadas?: number
  checagensHigieneMaosConformes?: number
}): IndicadoresAcreditacaoHospitalar {
  const totalSaidas = Math.max(1, dados.altas + dados.obitos)
  const capacidadeMaximaLeitosDia = Math.max(1, dados.leitosOperacionais * dados.diasPeriodo)

  // Média de Permanência (MP)
  const mediaPermanenciaDias = Math.round((dados.pacientesDia / totalSaidas) * 10) / 10

  // Taxa de Ocupação (%)
  const taxaOcupacaoPercentual =
    Math.round((dados.pacientesDia / capacidadeMaximaLeitosDia) * 1000) / 10

  // Intervalo de Substituição (Giro)
  const leitosDiaLivres = Math.max(0, capacidadeMaximaLeitosDia - dados.pacientesDia)
  const intervaloSubstituicaoDias = Math.round((leitosDiaLivres / totalSaidas) * 10) / 10

  // Densidade de Infecção por 1.000 pacientes-dia
  const densidadeInfeccaoPorMilPacientesDia =
    dados.pacientesDia > 0
      ? Math.round((dados.infeccoesIras / dados.pacientesDia) * 1000 * 10) / 10
      : 0

  // Taxa de Mortalidade Institucional (%)
  const taxaMortalidadeInstitucionalPercentual =
    Math.round((dados.obitos / totalSaidas) * 1000) / 10

  // Taxa de Readmissão em 30 dias (%)
  const taxaReadmissao30DiasPercentual =
    Math.round((dados.readmissoes30d / Math.max(1, dados.altas)) * 1000) / 10

  // Higiene das Mãos (%)
  const conformidadeHigiene =
    dados.checagensHigieneMaosRealizadas && dados.checagensHigieneMaosRealizadas > 0
      ? Math.round(
          ((dados.checagensHigieneMaosConformes ?? 0) / dados.checagensHigieneMaosRealizadas) * 1000
        ) / 10
      : 95.0

  return {
    periodoInicio: new Date(Date.now() - dados.diasPeriodo * 86400000).toISOString(),
    periodoFim: new Date().toISOString(),
    totalLeitosOperacionais: dados.leitosOperacionais,
    totalPacientesDia: dados.pacientesDia,
    mediaPermanenciaDias,
    taxaOcupacaoPercentual,
    intervaloSubstituicaoDias,
    totalInfeccoesHospitalares: dados.infeccoesIras,
    densidadeInfeccaoPorMilPacientesDia,
    taxaConformidadeHigieneMaosPercentual: conformidadeHigiene,
    totalAltas: dados.altas,
    totalObitos: dados.obitos,
    taxaMortalidadeInstitucionalPercentual,
    taxaReadmissao30DiasPercentual,
  }
}
