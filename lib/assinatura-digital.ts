import crypto from 'crypto'

export interface DadosCertificadoDigital {
  nomeSignatario: string
  cpfSignatario: string
  conselhoProfissional?: string // CRM, COREN, CRF
  numeroConselho?: string
  ufConselho?: string
  emissorCertificado: string // ex.: "AC SERPRO", "AC Certisign", "AC ICP-Brasil"
  numeroSerieCertificado?: string
  dataHoraAssinatura: string
  tipoAssinatura: 'ICP_BRASIL_A1' | 'ICP_BRASIL_A3' | 'ASSINATURA_NUVEM' | 'BIOMETRICA_AVANCADA'
}

export interface DocumentoAssinadoResultado {
  sucesso: boolean
  documentoId: string
  tipoDocumento: 'PRESCRICAO' | 'LAUDO' | 'EVOLUCAO' | 'SUMARIO_ALTA' | 'TERMO_CONSENTIMENTO'
  hashDocumentoSha256: string
  assinaturaDigital: DadosCertificadoDigital
  codigoValidacaoPublica: string
  urlVerificacaoPublica: string
  assinadoEm: string
}

export function gerarHashDocumento(conteudo: string | Buffer): string {
  return crypto.createHash('sha256').update(conteudo).digest('hex')
}

export function gerarCodigoValidacaoPublica(documentoId: string, hashSha256: string): string {
  const seed = `${documentoId}:${hashSha256}:${Date.now()}`
  const hash = crypto.createHash('sha256').update(seed).digest('hex').toUpperCase()
  // Formato: ABCD-1234-EFGH-5678
  return `${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`
}

export function assinarDocumentoClinico(
  documentoId: string,
  tipoDocumento: DocumentoAssinadoResultado['tipoDocumento'],
  conteudoDocumento: string,
  certificado: DadosCertificadoDigital,
  baseUrl = 'https://sgh.hospital.gov.br'
): DocumentoAssinadoResultado {
  const hashSha256 = gerarHashDocumento(conteudoDocumento)
  const codigoValidacao = gerarCodigoValidacaoPublica(documentoId, hashSha256)
  const assinadoEm = certificado.dataHoraAssinatura || new Date().toISOString()

  return {
    sucesso: true,
    documentoId,
    tipoDocumento,
    hashDocumentoSha256: hashSha256,
    assinaturaDigital: {
      ...certificado,
      dataHoraAssinatura: assinadoEm,
    },
    codigoValidacaoPublica: codigoValidacao,
    urlVerificacaoPublica: `${baseUrl}/validar-documento?codigo=${codigoValidacao}&doc=${documentoId}`,
    assinadoEm,
  }
}

export function verificarAutenticidadeDocumento(
  conteudoAtual: string,
  hashEsperado: string
): { autentico: boolean; hashAtual: string } {
  const hashAtual = gerarHashDocumento(conteudoAtual)
  return {
    autentico: hashAtual === hashEsperado,
    hashAtual,
  }
}
