// tests/unit/ajuste-estoque-massa.test.ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const schemaLoteAjuste = z.object({
  id: z.string().optional().nullable(),
  lote: z.string().min(1).max(80),
  validade: z.string().optional().nullable(),
  quantidade: z.number().int().min(0),
})

const schemaItemAjuste = z.object({
  medicamentoId: z.string(),
  novoSaldoTotal: z.number().int().min(0).optional(),
  lotes: z.array(schemaLoteAjuste).optional(),
  motivoItem: z.string().max(300).optional().nullable(),
})

const schemaAjusteMassa = z.object({
  motivoGeral: z.string().min(2).max(200),
  observacoesGerais: z.string().max(1000).optional().nullable(),
  dataAjuste: z.string().optional().nullable(),
  itens: z.array(schemaItemAjuste).min(1, 'Informe ao menos um item para ajuste.'),
})

describe('Ajuste de Estoque em Massa e Inventário Dinâmico', () => {
  it('deve validar um payload de ajuste em massa com múltiplos itens e lotes', () => {
    const payload = {
      motivoGeral: 'INVENTÁRIO / CONTAGEM FÍSICA PERIÓDICA',
      observacoesGerais: 'Contagem geral da farmácia central',
      dataAjuste: '2026-10-09',
      itens: [
        {
          medicamentoId: '98d5fb46-6086-4e55-b44c-000000000001',
          novoSaldoTotal: 150,
          lotes: [
            { lote: 'LT-2026-01', validade: '2027-12-31', quantidade: 100 },
            { lote: 'LT-2026-02', validade: '2028-06-30', quantidade: 50 },
          ],
          motivoItem: 'Contagem física confirmada',
        },
        {
          medicamentoId: '98d5fb46-6086-4e55-b44c-000000000002',
          novoSaldoTotal: 20,
          motivoItem: 'Quebra de frascos',
        },
      ],
    }

    const resultado = schemaAjusteMassa.safeParse(payload)
    expect(resultado.success).toBe(true)
    if (resultado.success) {
      expect(resultado.data.itens.length).toBe(2)
      expect(resultado.data.itens[0].lotes?.length).toBe(2)
      expect(resultado.data.motivoGeral).toContain('INVENTÁRIO')
    }
  })

  it('deve rejeitar payload sem motivo geral ou sem itens', () => {
    const payloadInvalido = {
      motivoGeral: '',
      itens: [],
    }

    const resultado = schemaAjusteMassa.safeParse(payloadInvalido)
    expect(resultado.success).toBe(false)
  })
})
