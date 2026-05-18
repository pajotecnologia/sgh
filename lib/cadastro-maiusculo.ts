// lib/cadastro-maiusculo.ts
// Texto em maiúsculas no padrão brasileiro (cadastro institucional / fichas).

import type { RegisterOptions } from 'react-hook-form';

/** Normaliza texto livre para maiúsculas (inputs controlados, submits). */
export function textoCadastroMaiusculo(text: string): string {
  return text.toLocaleUpperCase('pt-BR');
}

/**
 * Opções para `register(...)` — valores salvos no estado do formulário já em maiúsculas.
 */
export const registerTextoCadastro = {
  setValueAs: (v: unknown) => {
    if (v == null) return '';
    if (typeof v === 'string') return v.toLocaleUpperCase('pt-BR');
    return String(v).toLocaleUpperCase('pt-BR');
  },
} satisfies RegisterOptions;
