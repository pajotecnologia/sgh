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
