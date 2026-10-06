// tests/unit/laudo-solicitacao.test.ts

import { describe, it, expect } from 'vitest'
import { schemaLaudoSolicitacao } from '@/lib/validations/laudo-solicitacao'

describe('Laudo Médico para Solicitação', () => {
  it('deve validar um formulário de laudo de solicitação válido com opções marcadas e justificativa', () => {
    const payload = {
      status: 'EMITIDO',
      nomeHospital: 'Hospital Municipal Quiteria Alves Vilela',
      cnpjHospital: '11.222.333/0001-44',
      nomePaciente: 'Maria da Silva',
      numeroAih: '20261006-0001',
      procedimentoAnterior: '0303010037 - Tratamento Clínico',
      procedimentoSolicitado: '0303010193 - Tratamento Intensivo',
      nomeMedicoSolicitante: 'Dr. João Medeiros',
      crmMedicoSolicitante: '12345/PE',
      cpfMedicoSolicitante: '111.222.333-44',

      mudancaProcedimento: true,
      diariaUti: true,
      diariaAcompanhante: false,
      vacinaAntiRh: false,
      usoProteseOtica: false,
      usoFatoresCoagulacao: false,
      usoOrdenadores: false,
      nutricaoParenteral: true,

      justificativa:
        'Declaro para os devidos fins a necessidade de alteração de procedimento e cuidados em UTI.',
      dataSolicitacao: '2026-10-06',
      nomeAcompanhante: 'Carlos da Silva',
      dataAuditoria: '2026-10-06',
      parecerAuditor: 'Solicitação autorizada conforme critérios clínicos.',
      nomeAuditor: 'Dra. Auditora',
      crmAuditor: '54321/PE',
    }

    const resultado = schemaLaudoSolicitacao.safeParse(payload)
    expect(resultado.success).toBe(true)
    if (resultado.success) {
      expect(resultado.data.status).toBe('EMITIDO')
      expect(resultado.data.mudancaProcedimento).toBe(true)
      expect(resultado.data.diariaUti).toBe(true)
      expect(resultado.data.nutricaoParenteral).toBe(true)
      expect(resultado.data.diariaAcompanhante).toBe(false)
      expect(resultado.data.justificativa).toContain('Declaro para os devidos fins')
    }
  })

  it('deve aceitar campos opcionais e valores padrão em rascunho', () => {
    const payload = {
      nomePaciente: 'Paciente Teste',
      justificativa: 'Aguardando parecer',
    }

    const resultado = schemaLaudoSolicitacao.safeParse(payload)
    expect(resultado.success).toBe(true)
    if (resultado.success) {
      expect(resultado.data.status).toBe('RASCUNHO')
      expect(resultado.data.mudancaProcedimento).toBe(false)
      expect(resultado.data.diariaUti).toBe(false)
      expect(resultado.data.diariaAcompanhante).toBe(false)
    }
  })
})
