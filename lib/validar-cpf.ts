// lib/validar-cpf.ts — Validação de CPF (dígitos verificadores)

/**
 * Valida CPF usando o algoritmo de dígitos verificadores.
 * Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11).
 */
export function validarCPF(cpf: string): boolean {
  const limpo = cpf.replace(/\D/g, '')
  if (limpo.length !== 11) return false
  if (/^(\d)\1+$/.test(limpo)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo[i], 10) * (10 - i)
  }
  let digito1 = 11 - (soma % 11)
  if (digito1 >= 10) digito1 = 0

  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(limpo[i], 10) * (11 - i)
  }
  let digito2 = 11 - (soma % 11)
  if (digito2 >= 10) digito2 = 0

  return parseInt(limpo[9], 10) === digito1 && parseInt(limpo[10], 10) === digito2
}

/** Aplica máscara 000.000.000-00 durante a digitação. */
export function mascaraCpfInput(valor: string): string {
  const limpo = valor.replace(/\D/g, '').slice(0, 11)
  if (limpo.length <= 3) return limpo
  if (limpo.length <= 6) return `${limpo.slice(0, 3)}.${limpo.slice(3)}`
  if (limpo.length <= 9) return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6)}`
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9)}`
}

/** Valida número de documento quando o tipo informado é CPF. */
export function validarDocumentoCpfSeAplicavel(
  tipo: string | null | undefined,
  numero: string | null | undefined
): boolean {
  if (tipo !== 'CPF') return true
  const valor = numero?.trim() ?? ''
  if (!valor) return true
  return validarCPF(valor)
}
