import { describe, it, expect } from 'vitest'
import {
  assinarDocumentoClinico,
  verificarAutenticidadeDocumento,
  gerarHashDocumento,
} from '@/lib/assinatura-digital'
import {
  gerarHashTermo,
  TEMPLATES_TERMOS,
} from '@/lib/termos-eletronicos'

describe('Fase 1 — Assinatura Digital ICP-Brasil & Termos Eletrônicos', () => {
  it('deve gerar assinatura digital com hash SHA-256 e código de validação pública', () => {
    const conteudo = 'Prescrição Médica: Dipirona 500mg IV a cada 6 horas se dor ou febre.'
    const certificado = {
      nomeSignatario: 'Dr. Lucas Silveira',
      cpfSignatario: '123.456.789-00',
      conselhoProfissional: 'CRM',
      numeroConselho: '998877',
      ufConselho: 'SP',
      emissorCertificado: 'AC Certisign ICP-Brasil',
      tipoAssinatura: 'ICP_BRASIL_A1' as const,
      dataHoraAssinatura: '2026-09-23T14:00:00.000Z',
    }

    const resultado = assinarDocumentoClinico('presc-123', 'PRESCRICAO', conteudo, certificado)

    expect(resultado.sucesso).toBe(true)
    expect(resultado.hashDocumentoSha256).toBe(gerarHashDocumento(conteudo))
    expect(resultado.codigoValidacaoPublica).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    expect(resultado.urlVerificacaoPublica).toContain('validar-documento?codigo=')

    // Verificação de autenticidade
    const checagemValida = verificarAutenticidadeDocumento(conteudo, resultado.hashDocumentoSha256)
    expect(checagemValida.autentico).toBe(true)

    const checagemAdulterada = verificarAutenticidadeDocumento(
      conteudo + ' [TEXTO ADULTERADO]',
      resultado.hashDocumentoSha256
    )
    expect(checagemAdulterada.autentico).toBe(false)
  })

  it('deve formatar adequadamente os templates de termos de consentimento', () => {
    const tcle = TEMPLATES_TERMOS.TCLE_PROCEDIMENTO.template({
      pacienteNome: 'Mariana Costa',
      hospitalNome: 'Hospital Geral Municipal',
    })

    expect(tcle).toContain('Mariana Costa')
    expect(tcle).toContain('Hospital Geral Municipal')

    const hash = gerarHashTermo(tcle, '111.222.333-44', '2026-09-23T15:00:00Z')
    expect(hash).toHaveLength(64)
  })
})
