import { z } from 'zod'

/**
 * ID de registro no banco (Prisma @default(uuid())).
 * Não usa z.uuid() estrito — dados importados via SQL podem usar IDs legados;
 * a existência é validada na consulta ao banco.
 */
export const schemaIdEntidade = z
  .string()
  .trim()
  .min(1, 'ID obrigatório.')
  .max(36, 'ID inválido.')

export function mensagemErroValidacaoApi(detalhes?: Record<string, string[] | undefined>): string | null {
  if (!detalhes) return null
  const msgs = Object.values(detalhes).flat().filter(Boolean)
  return msgs.length ? msgs.join(' ') : null
}
