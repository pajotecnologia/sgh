import { describe, expect, it } from 'vitest'
import { formatarIdadeExtenso, formatarIdadeCurta } from '@/lib/formatar-idade'

describe('formatarIdadeExtenso', () => {
  it('retorna string vazia para valores nulos ou inválidos', () => {
    expect(formatarIdadeExtenso(null)).toBe('')
    expect(formatarIdadeExtenso(undefined)).toBe('')
    expect(formatarIdadeExtenso('')).toBe('')
    expect(formatarIdadeExtenso('data-invalida')).toBe('')
  })

  it('formata recém-nascido de hoje como 0 dias', () => {
    const hoje = new Date()
    expect(formatarIdadeExtenso(hoje)).toBe('Recém-nascido (0 dias)')
  })

  it('formata recém-nascido com menos de 30 dias em dias', () => {
    const hoje = new Date()
    const cincoDiasAtras = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 5)
    expect(formatarIdadeExtenso(cincoDiasAtras)).toBe('5 dias')

    const umDiaAtras = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1)
    expect(formatarIdadeExtenso(umDiaAtras)).toBe('1 dia')
  })

  it('formata bebês entre 1 e 11 meses em meses e dias', () => {
    const hoje = new Date()
    const tresMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 3, hoje.getDate())
    expect(formatarIdadeExtenso(tresMesesAtras)).toBe('3 meses')

    const umMesCincoDias = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate() - 5)
    expect(formatarIdadeExtenso(umMesCincoDias)).toContain('1 mês')
  })

  it('formata crianças e adultos com 1 ano ou mais em anos', () => {
    const hoje = new Date()
    const umAnoAtras = new Date(hoje.getFullYear() - 1, hoje.getMonth(), hoje.getDate())
    expect(formatarIdadeExtenso(umAnoAtras)).toBe('1 ano')

    const vinteAnosAtras = new Date(hoje.getFullYear() - 20, hoje.getMonth(), hoje.getDate())
    expect(formatarIdadeExtenso(vinteAnosAtras)).toBe('20 anos')
  })
})

describe('formatarIdadeCurta', () => {
  it('formata dias e meses em formato compacto', () => {
    const hoje = new Date()
    const dezDias = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 10)
    expect(formatarIdadeCurta(dezDias)).toBe('10d')

    const vinteAnos = new Date(hoje.getFullYear() - 20, hoje.getMonth(), hoje.getDate())
    expect(formatarIdadeCurta(vinteAnos)).toBe('20a')
  })
})
