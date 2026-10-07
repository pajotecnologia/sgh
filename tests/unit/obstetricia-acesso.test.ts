import { describe, expect, it } from 'vitest'
import { atendimentoObstetricoPermitido, ehSexoBiologicoFeminino } from '@/lib/obstetricia'

describe('Regras de elegibilidade obstétrica', () => {
  it('reconhece somente sexo biológico feminino como elegível', () => {
    expect(ehSexoBiologicoFeminino('FEMININO')).toBe(true)
    expect(ehSexoBiologicoFeminino('F')).toBe(true)
    expect(ehSexoBiologicoFeminino('MASCULINO')).toBe(false)
    expect(ehSexoBiologicoFeminino('INTERSEXO')).toBe(false)
    expect(ehSexoBiologicoFeminino(null)).toBe(false)
  })

  it('exige simultaneamente sexo feminino e atendimento obstétrico ativo', () => {
    expect(atendimentoObstetricoPermitido(true, 'FEMININO')).toBe(true)
    expect(atendimentoObstetricoPermitido(true, 'F')).toBe(true)
    expect(atendimentoObstetricoPermitido(false, 'FEMININO')).toBe(false)
    expect(atendimentoObstetricoPermitido(undefined, 'FEMININO')).toBe(false)
    expect(atendimentoObstetricoPermitido(true, 'MASCULINO')).toBe(false)
    expect(atendimentoObstetricoPermitido(true, 'INTERSEXO')).toBe(false)
  })
})
