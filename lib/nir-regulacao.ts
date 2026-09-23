export type StatusRegulacao =
  | 'SOLICITADA'
  | 'EM_ANALISE_CENTRAL'
  | 'VAGA_CEDIDA'
  | 'TRANSPORTE_ACIONADO'
  | 'CONCLUIDA'
  | 'CANCELADA'

export interface SolicitacaoRegulacaoInput {
  atendimentoId: string
  pacienteNome: string
  sistemaRegulacao: 'CROSS' | 'SUSFACIL' | 'CER_ESTADUAL' | 'REGULACAO_MUNICIPAL' | 'CONVENIO'
  numeroProtocoloCentral: string
  especialidadeDestino: string
  tipoVaga: 'UTI_ADULTO' | 'UTI_NEO' | 'UTI_PED' | 'ENFERMARIA_CIRURGICA' | 'HEMODINAMICA' | 'NEUROCIRURGIA' | 'OUTRA'
  prioridade: 'VERMELHO_ZERO' | 'URGENTE' | 'ROTINA'
  resumoClinico: string
  justificativaVaga: string
}

export interface RegistroRegulacaoItem extends SolicitacaoRegulacaoInput {
  id: string
  status: StatusRegulacao
  solicitadoEm: string
  horasEmRegulacao: number
  hospitalDestino?: string | null
  ambulanciaTipo?: 'USA_UTI_MOVEL' | 'USB_BASICA' | 'AEREA' | null
  motivoCancelamento?: string | null
}

export function calcularTempoEmRegulacao(solicitadoEm: Date): { horas: number; formatado: string; tempoCritico: boolean } {
  const diffMs = Date.now() - solicitadoEm.getTime()
  const horas = Math.max(0, diffMs / (1000 * 60 * 60))
  const dias = Math.floor(horas / 24)
  const restoHoras = Math.floor(horas % 24)

  const formatado = dias > 0 ? `${dias}d ${restoHoras}h` : `${Math.floor(horas)}h`
  const tempoCritico = horas > 24 // Mais de 24 horas aguardando vaga na regulação

  return { horas, formatado, tempoCritico }
}
