import { describe, it, expect } from 'vitest'
import { mascaraCnpj, mascaraTelefone, validarEmail, validarCnpj } from '@/lib/utils'

describe('Utilitários de Máscara e Validação (CNPJ, Telefone, E-mail)', () => {
  it('deve aplicar máscara de CNPJ corretamente', () => {
    expect(mascaraCnpj('12345678000195')).toBe('12.345.678/0001-95')
    expect(mascaraCnpj('12345')).toBe('12.345')
    expect(mascaraCnpj('12345678')).toBe('12.345.678')
    expect(mascaraCnpj('12.345.678/0001-95')).toBe('12.345.678/0001-95')
  })

  it('deve validar se CNPJ possui 14 dígitos', () => {
    expect(validarCnpj('12.345.678/0001-95')).toBe(true)
    expect(validarCnpj('12345678000195')).toBe(true)
    expect(validarCnpj('12345')).toBe(false)
  })

  it('deve aplicar máscara de Telefone / WhatsApp corretamente', () => {
    expect(mascaraTelefone('11987654321')).toBe('(11) 98765-4321')
    expect(mascaraTelefone('1133334444')).toBe('(11) 3333-4444')
    expect(mascaraTelefone('11')).toBe('(11')
  })

  it('deve validar formato de e-mail comercial', () => {
    expect(validarEmail('contato@fornecedor.com.br')).toBe(true)
    expect(validarEmail('financeiro@empresa.com')).toBe(true)
    expect(validarEmail('email-invalido')).toBe(false)
    expect(validarEmail('')).toBe(true) // opcional
  })
})
