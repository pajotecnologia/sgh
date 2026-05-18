// lib/utils.ts
// Utilitários gerais compartilhados em toda a aplicação

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes Tailwind de forma segura, resolvendo conflitos.
 * Uso: cn('px-4 py-2', condicional && 'bg-primary', props.className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata CPF para exibição: 12345678900 → 123.456.789-00
 */
export function formatarCpf(cpf: string): string {
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11) return cpf;
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9)}`;
}

/**
 * Formata telefone: 11999999999 → (11) 99999-9999
 */
export function formatarTelefone(tel: string): string {
  const limpo = tel.replace(/\D/g, '');
  if (limpo.length === 11) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
  }
  if (limpo.length === 10) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  }
  return tel;
}

/**
 * Calcula IMC e retorna o valor e a classificação
 */
export function calcularImc(pesoKg: number, alturaCm: number): {
  imc: number;
  classificacao: string;
} {
  const alturaM = alturaCm / 100;
  const imc = pesoKg / (alturaM * alturaM);
  const imcArredondado = Math.round(imc * 100) / 100;

  let classificacao: string;
  if (imc < 18.5) classificacao = 'Abaixo do peso';
  else if (imc < 25) classificacao = 'Peso normal';
  else if (imc < 30) classificacao = 'Sobrepeso';
  else if (imc < 35) classificacao = 'Obesidade grau I';
  else if (imc < 40) classificacao = 'Obesidade grau II';
  else classificacao = 'Obesidade grau III';

  return { imc: imcArredondado, classificacao };
}

/**
 * Calcula tempo de espera em minutos desde uma data de referência
 */
export function calcularTempoEspera(desde: Date): number {
  return Math.floor((Date.now() - desde.getTime()) / 60000);
}

/**
 * Verifica se o tempo de espera excedeu o limite do Protocolo Manchester
 */
export function alertaTempoManchester(
  corTriagem: string,
  tempoEsperaMinutos: number
): boolean {
  const limites: Record<string, number | null> = {
    VERMELHO: 0,
    LARANJA: 10,
    AMARELO: 30,
    VERDE: 60,
    AZUL: 120,
    CINZA: null,
  };
  const limite = limites[corTriagem];
  if (limite === null) return false;
  return tempoEsperaMinutos > limite;
}
