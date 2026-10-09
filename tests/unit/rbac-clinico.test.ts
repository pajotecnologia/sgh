import { describe, expect, it } from 'vitest'
import { atendimentoPodeSerEditado, medicoPodeAcessarAtendimento, podeExecutarAcaoClinica } from '@/lib/rbac-clinico'

describe('RBAC clínico', () => {
  it('separa leitura de edição do prontuário', () => {
    expect(podeExecutarAcaoClinica('ENFERMEIRO', 'VISUALIZAR_PRONTUARIO')).toBe(true)
    expect(podeExecutarAcaoClinica('ENFERMEIRO', 'EDITAR_PRONTUARIO')).toBe(false)
    expect(podeExecutarAcaoClinica('MEDICO', 'EDITAR_PRONTUARIO')).toBe(true)
  })
  it('limita médico ao atendimento atribuído', () => {
    expect(medicoPodeAcessarAtendimento('MEDICO', 'u1', 'u1')).toBe(true)
    expect(medicoPodeAcessarAtendimento('MEDICO', 'u1', 'u2')).toBe(false)
    expect(medicoPodeAcessarAtendimento('DIRETOR_CLINICO', 'u1', 'u2')).toBe(true)
  })
  it('bloqueia edição de atendimentos encerrados', () => {
    expect(atendimentoPodeSerEditado('EM_ATENDIMENTO')).toBe(true)
    expect(atendimentoPodeSerEditado('ALTA')).toBe(false)
    expect(atendimentoPodeSerEditado('OBITO')).toBe(false)
  })
  it('bloqueia transferência e interdição de leito para recepcionista', () => {
    expect(podeExecutarAcaoClinica('RECEPCIONISTA', 'TRANSFERIR_LEITO')).toBe(false)
    expect(podeExecutarAcaoClinica('RECEPCIONISTA', 'INTERDITAR_LEITO')).toBe(false)
    expect(podeExecutarAcaoClinica('MEDICO', 'TRANSFERIR_LEITO')).toBe(true)
    expect(podeExecutarAcaoClinica('ENFERMEIRO', 'TRANSFERIR_LEITO')).toBe(true)
    expect(podeExecutarAcaoClinica('ADMIN', 'TRANSFERIR_LEITO')).toBe(true)
    expect(podeExecutarAcaoClinica('DIRETOR_CLINICO', 'TRANSFERIR_LEITO')).toBe(true)
    expect(podeExecutarAcaoClinica('ENFERMEIRO', 'INTERDITAR_LEITO')).toBe(true)
    expect(podeExecutarAcaoClinica('ADMIN', 'INTERDITAR_LEITO')).toBe(true)
    expect(podeExecutarAcaoClinica('DIRETOR_CLINICO', 'INTERDITAR_LEITO')).toBe(true)
    expect(podeExecutarAcaoClinica('MEDICO', 'INTERDITAR_LEITO')).toBe(false)
  })
  it('permite concessão de alta apenas para médico, diretor clínico e admin', () => {
    expect(podeExecutarAcaoClinica('MEDICO', 'CONCEDER_ALTA')).toBe(true)
    expect(podeExecutarAcaoClinica('DIRETOR_CLINICO', 'CONCEDER_ALTA')).toBe(true)
    expect(podeExecutarAcaoClinica('ADMIN', 'CONCEDER_ALTA')).toBe(true)
    expect(podeExecutarAcaoClinica('ENFERMEIRO', 'CONCEDER_ALTA')).toBe(false)
    expect(podeExecutarAcaoClinica('TECNICO_ENFERMAGEM', 'CONCEDER_ALTA')).toBe(false)
    expect(podeExecutarAcaoClinica('RECEPCIONISTA', 'CONCEDER_ALTA')).toBe(false)
  })
})

