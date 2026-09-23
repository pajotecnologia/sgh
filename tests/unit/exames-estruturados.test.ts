import { describe, it, expect } from 'vitest'
import {
  determinarStatusParametro,
  parseResultadoExame,
  serializarResultadoExame,
} from '@/lib/exames-estruturados'

describe('Exames Estruturados & Valores de Referência', () => {
  it('deve classificar corretamente os valores em relação às faixas de referência', () => {
    // Referência: 12 a 16
    expect(determinarStatusParametro(14, 12, 16)).toBe('NORMAL')
    expect(determinarStatusParametro(11, 12, 16)).toBe('ABAIXO')
    expect(determinarStatusParametro(18, 12, 16)).toBe('ACIMA')
    // Crítico: < 12 * 0.7 = 8.4
    expect(determinarStatusParametro(7.2, 12, 16)).toBe('CRITICO')
    // Crítico: > 16 * 1.5 = 24
    expect(determinarStatusParametro(28.5, 12, 16)).toBe('CRITICO')
  })

  it('deve fazer parse de JSON estruturado de resultado de exame', () => {
    const rawJson = JSON.stringify({
      textoLaudo: 'Anemia leve normocítica',
      parametros: [
        {
          nome: 'Hemoglobina',
          valor: '10.5',
          unidade: 'g/dL',
          referenciaMin: 12.0,
          referenciaMax: 16.0,
        },
        {
          nome: 'Leucócitos',
          valor: '6500',
          unidade: '/mm³',
          referenciaMin: 4000,
          referenciaMax: 10000,
        },
      ],
      metodo: 'Automatizado Coulter',
    })

    const parsed = parseResultadoExame(rawJson)

    expect(parsed.textoLaudo).toBe('Anemia leve normocítica')
    expect(parsed.metodo).toBe('Automatizado Coulter')
    expect(parsed.parametros).toHaveLength(2)
    expect(parsed.parametros![0].status).toBe('ABAIXO')
    expect(parsed.parametros![1].status).toBe('NORMAL')
  })

  it('deve fazer fallback transparente para laudos em texto puro', () => {
    const textoSimples = 'Radiografia de tórax em PA sem alterações pleuropulmonares agudas.'
    const parsed = parseResultadoExame(textoSimples)

    expect(parsed.textoLaudo).toBe(textoSimples)
    expect(parsed.parametros).toHaveLength(0)
  })
})
