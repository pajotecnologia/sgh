// lib/validations/sae.ts — Ficha SAE (Sistematização da Assistência de Enfermagem)

import { z } from 'zod'

const listaChaves = z.array(z.string().max(60)).optional()
const mapaTextos = z.record(z.string(), z.string().max(500)).optional()

export const schemaFichaSae = z.object({
  id: z.string().uuid().optional(),
  dataReferencia: z.string().min(8, 'Informe a data da ficha.'),
  nomePaciente: z.string().max(300).optional().or(z.literal('')),
  numeroProntuario: z.string().max(30).optional().or(z.literal('')),
  leitoDescricao: z.string().max(200).optional().or(z.literal('')),
  // { "estadoGeral": ["REGULAR"], "pupilas": ["ISOCORICAS","REAGENTES"], ... }
  selecoes: z.record(z.string(), z.array(z.string().max(60))).optional(),
  textos: mapaTextos,
  diagnosticos: listaChaves,
  prescricoes: listaChaves,
  registroDiurno: z.string().max(8000).optional().or(z.literal('')),
  registroNoturno: z.string().max(8000).optional().or(z.literal('')),
})

export type FichaSaeForm = z.infer<typeof schemaFichaSae>
