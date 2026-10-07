import { describe, expect, it } from 'vitest'
import { MENU_PERMISSOES, permissaoPadrao } from '@/lib/permissoes-menu'
import { normalizarPermissoes } from '@/lib/permissoes-usuario'

describe('Permissões do menu', () => {
  it('mantém os padrões atuais por cargo', () => {
    expect(permissaoPadrao('recepcao', 'RECEPCIONISTA')).toBe(true)
    expect(permissaoPadrao('triagem', 'RECEPCIONISTA')).toBe(false)
    expect(permissaoPadrao('triagem', 'ENFERMEIRO')).toBe(true)
    expect(permissaoPadrao('atendimento-medico', 'MEDICO')).toBe(true)
    expect(permissaoPadrao('farmacia', 'FARMACEUTICO')).toBe(true)
    expect(permissaoPadrao('auditoria', 'ADMIN')).toBe(true)
  })

  it('possui chave única para cada item configurável', () => {
    const chaves = MENU_PERMISSOES.map((item) => item.chave)
    expect(new Set(chaves).size).toBe(chaves.length)
  })

  it('ignora chaves desconhecidas e valores inválidos', () => {
    expect(normalizarPermissoes({
      recepcao: false,
      triagem: true,
      desconhecida: true,
      farmacia: 'sim',
    })).toEqual({
      recepcao: false,
      triagem: true,
    })
  })
})
