// lib/validations/sinais-vitais.ts — Ficha de sinais vitais (controle horário 24h + balanço hídrico)

import { z } from 'zod'

// Horas do plantão na ordem da ficha (07h do dia → 06h do dia seguinte)
export const HORAS_FICHA_SINAIS = [
  7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
  1, 2, 3, 4, 5, 6,
] as const

export const LINHAS_CONTROLE_HORARIO = [
  { key: 'PRESSAO_ARTERIAL', label: 'Pressão arterial' },
  { key: 'PULSO', label: 'Pulso' },
  { key: 'TEMPERATURA', label: 'Temperatura' },
  { key: 'RESPIRACAO', label: 'Respiração' },
  { key: 'SATURACAO', label: 'Saturação' },
  { key: 'HGT', label: 'HGT' },
] as const

export const LINHAS_GANHOS = [
  { key: 'SONDA', label: 'Sonda' },
  { key: 'S_FISIOLOGICO', label: 'S. Fisiológico' },
  { key: 'S_GLICOSADO', label: 'S. Glicosado' },
  { key: 'S_RINGER', label: 'S. Ringer' },
  { key: 'SANGUE', label: 'Sangue' },
  { key: 'PLASMA', label: 'Plasma' },
  { key: 'ORAL', label: 'Oral' },
] as const

export const LINHAS_PERDAS = [
  { key: 'DIURESE', label: 'Diurese' },
  { key: 'FEZES', label: 'Fezes' },
  { key: 'HEMORRAGIAS', label: 'Hemorragias' },
] as const

const celula = z.string().max(20).optional().or(z.literal(''))

// { "PRESSAO_ARTERIAL": { "7": "120/80", "8": "" , ... }, ... }
const grid = z.record(z.string(), z.record(z.string(), celula))

export const schemaFichaSinaisVitais = z.object({
  id: z.string().uuid().optional(),
  dataReferencia: z.string().min(8, 'Informe a data da ficha.'),
  nomePaciente: z.string().max(300).optional().or(z.literal('')),
  numeroProntuario: z.string().max(30).optional().or(z.literal('')),
  leitoDescricao: z.string().max(200).optional().or(z.literal('')),
  controleHorario: grid.optional(),
  balancoHidrico: z
    .object({
      ganhos: grid.optional(),
      perdas: grid.optional(),
    })
    .optional(),
})

export type FichaSinaisVitaisForm = z.infer<typeof schemaFichaSinaisVitais>
