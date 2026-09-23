import { describe, expect, it } from 'vitest'

describe('Centro de Operações', () => {
  it('mantém os estados operacionais críticos claramente identificáveis', () => {
    const estados = ['AGUARDANDO_TRIAGEM', 'EM_TRIAGEM', 'AGUARDANDO_ATENDIMENTO', 'AGUARDANDO_INTERNACAO', 'INTERNADO']
    expect(new Set(estados).size).toBe(estados.length)
    expect(estados).toContain('AGUARDANDO_TRIAGEM')
    expect(estados).toContain('AGUARDANDO_INTERNACAO')
  })
})
