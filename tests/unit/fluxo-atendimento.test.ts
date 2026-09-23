import { describe, expect, it } from 'vitest'
import { statusExigeLeito, statusFinaisInternacao, transicaoAtendimentoPermitida, usuarioPodeExecutarTransicao } from '@/lib/fluxo-atendimento'

describe('fluxo de atendimento', () => {
  it('permite somente transições válidas', () => {
    expect(transicaoAtendimentoPermitida('AGUARDANDO_TRIAGEM', 'EM_TRIAGEM')).toBe(true)
    expect(transicaoAtendimentoPermitida('EM_TRIAGEM', 'EM_ATENDIMENTO')).toBe(false)
    expect(transicaoAtendimentoPermitida('EM_ATENDIMENTO', 'AGUARDANDO_INTERNACAO')).toBe(true)
    expect(transicaoAtendimentoPermitida('INTERNADO', 'ALTA')).toBe(true)
    expect(transicaoAtendimentoPermitida('ALTA', 'EM_ATENDIMENTO')).toBe(false)
  })
  it('aplica permissões por perfil sem alterar a matriz de transições', () => {
    expect(usuarioPodeExecutarTransicao('ENFERMEIRO', 'AGUARDANDO_TRIAGEM', 'EM_TRIAGEM')).toBe(true)
    expect(usuarioPodeExecutarTransicao('ENFERMEIRO', 'AGUARDANDO_ATENDIMENTO', 'EM_ATENDIMENTO')).toBe(true)
    expect(usuarioPodeExecutarTransicao('ENFERMEIRO', 'EM_ATENDIMENTO', 'AGUARDANDO_INTERNACAO')).toBe(false)
    expect(usuarioPodeExecutarTransicao('MEDICO', 'EM_ATENDIMENTO', 'AGUARDANDO_INTERNACAO')).toBe(true)
    expect(usuarioPodeExecutarTransicao('MEDICO', 'ALTA', 'EM_ATENDIMENTO')).toBe(false)
  })
  it('identifica estados que exigem/liberam leito', () => {
    expect(statusExigeLeito('INTERNADO')).toBe(true)
    expect(statusFinaisInternacao('ALTA')).toBe(true)
    expect(statusFinaisInternacao('TRANSFERIDO')).toBe(true)
    expect(statusFinaisInternacao('OBITO')).toBe(true)
  })
})
