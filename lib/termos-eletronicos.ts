import { prisma } from '@/lib/prisma'
import { gerarHashDocumento } from '@/lib/assinatura-digital'

export type TipoTermoConsentimento =
  | 'TCLE_PROCEDIMENTO'
  | 'TCLE_TRANSFUSAO_SANGUE'
  | 'TERMO_INTERNACAO_HOSPITALAR'
  | 'TERMO_RECUSA_TRATAMENTO'
  | 'TERMO_EVASAO_ALTA_REVELIA'
  | 'CONSENTIMENTO_LGPD'

export interface TermoConsentimentoInput {
  atendimentoId: string
  pacienteId: string
  tipoTermo: TipoTermoConsentimento
  tituloTermo: string
  textoCompleto: string
  nomeSignatario: string
  cpfSignatario: string
  parentesco?: string // "O próprio", "Mãe", "Pai", "Cônjuge", "Responsável Legal"
  assinaturaCanvasBase64?: string
  ipOrigem?: string
  userAgent?: string
}

export interface TermoConsentimentoSalvo {
  id: string
  atendimentoId: string
  tipoTermo: TipoTermoConsentimento
  tituloTermo: string
  nomeSignatario: string
  cpfSignatario: string
  parentesco: string
  hashTermoSha256: string
  assinadoEm: string
  status: 'ASSINADO' | 'REVOGADO'
}

export const TEMPLATES_TERMOS: Record<TipoTermoConsentimento, { titulo: string; template: (p: { pacienteNome: string; hospitalNome: string }) => string }> = {
  TCLE_PROCEDIMENTO: {
    titulo: 'Termo de Consentimento Livre e Esclarecido (TCLE) para Procedimento',
    template: ({ pacienteNome, hospitalNome }) =>
      `Declaro que fui informado(a) e esclarecido(a) de forma clara pelo corpo clínico do ${hospitalNome} sobre a natureza, benefícios, riscos potenciais e alternativas do procedimento proposto para o(a) paciente ${pacienteNome}. Tive a oportunidade de fazer perguntas e esclarecer todas as dúvidas, consentindo de livre e espontânea vontade com a realização do procedimento.`,
  },
  TCLE_TRANSFUSAO_SANGUE: {
    titulo: 'Termo de Consentimento para Hemoterapia e Transfusão de Sangue',
    template: ({ pacienteNome, hospitalNome }) =>
      `Autorizo a equipe médica do ${hospitalNome} a realizar transfusão de sangue e/ou hemocomponentes no(a) paciente ${pacienteNome}, estando ciente das indicações clínicas, potenciais reações adversas e benefícios terapêuticos necessários para a preservação de sua saúde e vida.`,
  },
  TERMO_INTERNACAO_HOSPITALAR: {
    titulo: 'Termo de Compromisso e Internação Hospitalar',
    template: ({ pacienteNome, hospitalNome }) =>
      `Declaro ciência das normas internas, direitos e deveres durante a internação do(a) paciente ${pacienteNome} no ${hospitalNome}, comprometendo-me a fornecer informações fidedignas sobre histórico de saúde e medicamentos em uso.`,
  },
  TERMO_RECUSA_TRATAMENTO: {
    titulo: 'Termo de Responsabilidade por Recusa de Tratamento ou Procedimento',
    template: ({ pacienteNome, hospitalNome }) =>
      `Declaro que, após devidamente orientado(a) pelo médico assistente sobre os riscos de agravamento do quadro clínico, sequelas e iminência de dano à saúde, opto livremente por RECUSAR o tratamento/procedimento indicado para o(a) paciente ${pacienteNome} no ${hospitalNome}, assumindo inteira responsabilidade por tal decisão.`,
  },
  TERMO_EVASAO_ALTA_REVELIA: {
    titulo: 'Termo de Alta a Pedido / Evasão Hospitalar',
    template: ({ pacienteNome, hospitalNome }) =>
      `Declaro que estou ciente da não recomendação de alta médica neste momento e decido deixar as dependências do ${hospitalNome} por minha própria conta e risco, assumindo todas as consequências clínicas decorrentes da interrupção do tratamento.`,
  },
  CONSENTIMENTO_LGPD: {
    titulo: 'Termo de Consentimento para Tratamento de Dados Pessoais de Saúde (LGPD)',
    template: ({ pacienteNome, hospitalNome }) =>
      `Autorizo o ${hospitalNome} a realizar o tratamento e guarda dos dados pessoais e sensíveis de saúde do(a) paciente ${pacienteNome} para fins estritos de assistência à saúde, faturamento, prontuário médico e cumprimento de obrigações legais, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).`,
  },
}

export function gerarHashTermo(texto: string, signatarioCpf: string, timestamp: string): string {
  return gerarHashDocumento(`${texto}|${signatarioCpf}|${timestamp}`)
}
