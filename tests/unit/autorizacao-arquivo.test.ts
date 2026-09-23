import { describe, expect, it } from 'vitest'
import { caminhoExamePrivadoValido, normalizarCaminhoRelativo } from '@/lib/autorizacao-arquivo'

describe('política de arquivos clínicos', () => {
  it('normaliza caminhos sem permitir traversal', () => {
    expect(normalizarCaminhoRelativo('exames/abc.pdf')).toBe('exames/abc.pdf')
    expect(normalizarCaminhoRelativo('/exames/abc.pdf')).toBe('exames/abc.pdf')
    expect(normalizarCaminhoRelativo('exames/../segredo.pdf')).toBeNull()
  })

  it('aceita somente PDFs de exame com identificador UUID', () => {
    expect(caminhoExamePrivadoValido('exames/550e8400-e29b-41d4-a716-446655440000.pdf')).toBe(true)
    expect(caminhoExamePrivadoValido('exames/resultado.pdf')).toBe(false)
    expect(caminhoExamePrivadoValido('documentos/550e8400-e29b-41d4-a716-446655440000.pdf')).toBe(false)
  })
})
