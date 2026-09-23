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
})
