import { beforeEach, describe, expect, it } from 'vitest'
import { __resetRateLimitParaTestes, verificarRateLimit } from '@/lib/rate-limit'

describe('rate-limit', () => {
  beforeEach(() => __resetRateLimitParaTestes())

  it('permite até o limite e bloqueia o excesso', () => {
    expect(verificarRateLimit('teste', { limite: 2, janelaSegundos: 60 }).sucesso).toBe(true)
    expect(verificarRateLimit('teste', { limite: 2, janelaSegundos: 60 }).sucesso).toBe(true)
    const terceiro = verificarRateLimit('teste', { limite: 2, janelaSegundos: 60 })
    expect(terceiro.sucesso).toBe(false)
    expect(terceiro.restantes).toBe(0)
    expect(terceiro.retryAfterSegundos).toBeGreaterThan(0)
  })

  it('isola chaves de usuários/endpoints diferentes', () => {
    expect(verificarRateLimit('a', { limite: 1, janelaSegundos: 60 }).sucesso).toBe(true)
    expect(verificarRateLimit('b', { limite: 1, janelaSegundos: 60 }).sucesso).toBe(true)
  })
})
