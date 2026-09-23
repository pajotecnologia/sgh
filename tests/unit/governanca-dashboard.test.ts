import { describe, expect, it } from 'vitest'

describe('governança operacional', () => {
  it('mantém o contrato dos indicadores de segurança e LGPD', () => {
    const chaves = [
      'acessosPacienteHoje',
      'auditoriasHoje',
      'falhasLoginHoje',
      'sessoesAtivas',
      'eventosMfaHoje',
      'acessosSensíveisRecentes',
    ]

    expect(new Set(chaves).size).toBe(chaves.length)
    expect(chaves).toContain('falhasLoginHoje')
    expect(chaves).toContain('acessosPacienteHoje')
  })
})
