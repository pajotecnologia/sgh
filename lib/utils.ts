import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PROTOCOLO_MANCHESTER } from "@/types"
import type { CorTriagem } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Minutos de espera desde a entrada na fila */
export function calcularTempoEspera(entrada: Date | string): number {
  const inicio = entrada instanceof Date ? entrada : new Date(entrada)
  if (Number.isNaN(inicio.getTime())) return 0
  return Math.max(0, Math.floor((Date.now() - inicio.getTime()) / 60000))
}

/** Verifica se o tempo de espera ultrapassou o limite Manchester */
export function alertaTempoManchester(cor: CorTriagem | string, minutosEspera: number): boolean {
  const config = PROTOCOLO_MANCHESTER.find((c) => c.cor === cor)
  if (!config || config.tempoMaximoMinutos === null) return false
  if (config.tempoMaximoMinutos === 0) return minutosEspera > 0
  return minutosEspera > config.tempoMaximoMinutos
}

/** Calcula IMC a partir de peso (kg) e altura (cm) */
export function calcularImc(pesoKg: number, alturaCm: number): { imc: number; classificacao: string } {
  const alturaM = alturaCm / 100
  const imc = alturaM > 0 ? pesoKg / (alturaM * alturaM) : 0

  let classificacao = '—'
  if (imc < 18.5) classificacao = 'Abaixo do peso'
  else if (imc < 25) classificacao = 'Peso normal'
  else if (imc < 30) classificacao = 'Sobrepeso'
  else if (imc < 35) classificacao = 'Obesidade grau I'
  else if (imc < 40) classificacao = 'Obesidade grau II'
  else classificacao = 'Obesidade grau III'

  return { imc: Math.round(imc * 100) / 100, classificacao }
}

/** Aplica máscara de CNPJ: 00.000.000/0000-00 */
export function mascaraCnpj(valor: string): string {
  const limpo = valor.replace(/\D/g, '').slice(0, 14)
  if (limpo.length <= 2) return limpo
  if (limpo.length <= 5) return `${limpo.slice(0, 2)}.${limpo.slice(2)}`
  if (limpo.length <= 8) return `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5)}`
  if (limpo.length <= 12) return `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5, 8)}/${limpo.slice(8)}`
  return `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5, 8)}/${limpo.slice(8, 12)}-${limpo.slice(12)}`
}

/** Aplica máscara de Telefone/WhatsApp: (00) 0000-0000 ou (00) 90000-0000 */
export function mascaraTelefone(valor: string): string {
  const limpo = valor.replace(/\D/g, '').slice(0, 11)
  if (limpo.length <= 2) return limpo.length ? `(${limpo}` : ''
  if (limpo.length <= 6) return `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`
  if (limpo.length <= 10) return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`
  return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`
}

/** Valida sintaxe básica de e-mail */
export function validarEmail(email: string): boolean {
  if (!email || !email.trim()) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/** Valida se o CNPJ tem 14 dígitos */
export function validarCnpj(cnpj: string): boolean {
  const limpo = cnpj.replace(/\D/g, '')
  return limpo.length === 14
}
