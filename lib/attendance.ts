// lib/attendance.ts
// Geração de número único de atendimento e utilitários relacionados

import { v4 as uuidv4 } from 'uuid';

function formatarDataYYYYMMDDUtc(data: Date): string {
  const y = data.getUTCFullYear();
  const m = String(data.getUTCMonth() + 1).padStart(2, '0');
  const d = String(data.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function formatarDataYYYYMMDDLocal(data: Date): string {
  const y = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Gera um número único de atendimento no formato: AAAAMMDD-XXXX
 * Exemplo: 20240315-A1B2
 *
 * O sufixo é composto pelos primeiros 4 caracteres de um UUID v4 em maiúsculas,
 * garantindo unicidade suficiente para o volume hospitalar típico.
 * A unicidade final é garantida por constraint UNIQUE no banco de dados.
 */
export function gerarNumeroAtendimento(dataReferencia?: Date): string {
  const data = dataReferencia ?? new Date();
  // Quando o chamador passa uma Date "date-only" (ex: new Date('2024-03-15')),
  // ela pode variar por timezone. Para manter determinismo, usamos UTC nesse caso.
  const prefixoData = dataReferencia ? formatarDataYYYYMMDDUtc(data) : formatarDataYYYYMMDDLocal(data);
  // Usar os primeiros 8 chars do UUID para o sufixo (ex: A1B2C3D4)
  const sufixo = uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `${prefixoData}-${sufixo}`;
}

/**
 * Valida se uma string está no formato de número de atendimento esperado.
 * Formato: YYYYMMDD-XXXXXXXX (data + 8 caracteres alfanuméricos)
 */
export function validarNumeroAtendimento(numero: string): boolean {
  return /^\d{8}-[A-Z0-9]{8}$/.test(numero);
}
