import { describe, expect, it } from 'vitest'
import { criarUriTotp, gerarSegredoTotp, verificarTotp } from '@/lib/totp'

describe('TOTP', () => {
  it('gera segredo e URI compatíveis com otpauth', () => {
    const secret = gerarSegredoTotp()
    const uri = criarUriTotp(secret, 'teste@hospital.local')
    expect(secret).toMatch(/^[A-Z2-7]+$/)
    expect(uri).toContain('otpauth://totp/')
    expect(uri).toContain('secret=' + secret)
  })

  it('rejeita códigos inválidos', () => {
    expect(verificarTotp('JBSWY3DPEHPK3PXP', '000000')).toBe(false)
    expect(verificarTotp('JBSWY3DPEHPK3PXP', 'abc')).toBe(false)
  })
})
