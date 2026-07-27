// lib/validations/evolucao-multiprofissional.ts

import { z } from 'zod'

export const CATEGORIAS_MULTIPROFISSIONAL = [
  'NUTRICAO',
  'FISIOTERAPIA',
  'SERVICO_SOCIAL',
  'PSICOLOGIA',
  'FARMACIA',
  'FONOAUDIOLOGIA',
  'PLANO_CONJUNTO',
  'OUTRO',
] as const

export const schemaNovaEvolucaoMultiprofissional = z.object({
  dataHora: z.string().min(8, 'Informe a data/hora.'),
  evolucao: z.string().min(3, 'Descreva a evolução.').max(8000),
  categoria: z.enum(CATEGORIAS_MULTIPROFISSIONAL).optional(),
})

export type NovaEvolucaoMultiprofissionalForm = z.infer<typeof schemaNovaEvolucaoMultiprofissional>
