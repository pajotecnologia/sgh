// lib/validations/obstetricia.ts — Fichas obstétricas (internação/alta e berçário)

import { z } from 'zod'

const mapaCampos = z.record(z.string(), z.string().max(4000)).optional()
const linhasTabela = z.array(z.record(z.string(), z.string().max(500))).optional()

export const schemaFichaInternacaoObstetrica = z.object({
  campos: mapaCampos,
  trabalhoParto: linhasTabela,
  puerperio: linhasTabela,
  recemNascido: mapaCampos,
  condicoesAlta: mapaCampos,
})

export const schemaFichaBercario = z.object({
  campos: mapaCampos,
  evolucao: z
    .array(
      z.object({
        dataHora: z.string().max(40),
        tipo: z.string().max(40).optional(),
        texto: z.string().max(4000),
        nomeProfissional: z.string().max(200).optional(),
      })
    )
    .optional(),
})

export type FichaInternacaoObstetricaForm = z.infer<typeof schemaFichaInternacaoObstetrica>
export type FichaBercarioForm = z.infer<typeof schemaFichaBercario>
