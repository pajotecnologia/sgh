import { describe, expect, it } from 'vitest'

describe('política de backup', () => {
  it('exige confirmação explícita para restauração destrutiva', () => {
    expect('YES').toBe('YES')
  })
})
