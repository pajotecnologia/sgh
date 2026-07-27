// lib/validations/triagem.ts
// Schemas Zod para validação do Módulo 2 — Triagem / Protocolo Manchester

import { z } from 'zod';
import {
  ESTADO_CONSCIENCIA_SINAIS_KEYS,
  type EstadoConscienciaSinaisKey,
} from '@/lib/triagem-estado-consciencia-sinais';
import { schemaIdEntidade } from '@/lib/validations/id';

const schemaEstadoConscienciaSinaisKey = z.enum(
  ESTADO_CONSCIENCIA_SINAIS_KEYS as unknown as [
    EstadoConscienciaSinaisKey,
    ...EstadoConscienciaSinaisKey[],
  ]
);

export const schemaSinaisVitais = z.object({
  paSistolica: z
    .number({ invalid_type_error: 'PA sistólica deve ser um número.' })
    .int()
    .min(40, 'PA sistólica inválida.')
    .max(300, 'PA sistólica inválida.')
    .optional(),
  paDiastolica: z
    .number({ invalid_type_error: 'PA diastólica deve ser um número.' })
    .int()
    .min(20, 'PA diastólica inválida.')
    .max(200, 'PA diastólica inválida.')
    .optional(),
  frequenciaCardiaca: z
    .number()
    .int()
    .min(20, 'FC inválida.')
    .max(300, 'FC inválida.')
    .optional(),
  frequenciaResp: z
    .number()
    .int()
    .min(4, 'FR inválida.')
    .max(80, 'FR inválida.')
    .optional(),
  spo2: z
    .number()
    .min(50, 'SpO2 inválida.')
    .max(100, 'SpO2 inválida.')
    .optional(),
  temperatura: z
    .number()
    .min(30, 'Temperatura inválida.')
    .max(45, 'Temperatura inválida.')
    .optional(),
  glicemia: z
    .number()
    .int()
    .min(10, 'Glicemia inválida.')
    .max(800, 'Glicemia inválida.')
    .optional(),
  escalaDor: z
    .number()
    .int()
    .min(0, 'Escala de dor: 0 a 10.')
    .max(10, 'Escala de dor: 0 a 10.')
    .optional(),
  peso: z
    .number()
    .min(0.5, 'Peso inválido.')
    .max(500, 'Peso inválido.')
    .optional(),
  altura: z
    .number()
    .int()
    .min(30, 'Altura inválida (em cm).')
    .max(250, 'Altura inválida (em cm).')
    .optional(),
});

export const schemaRegistrarTriagem = z.object({
  atendimentoId: schemaIdEntidade,
  corClassificacao: z.enum(
    ['VERMELHO', 'LARANJA', 'AMARELO', 'VERDE', 'AZUL', 'CINZA'],
    { errorMap: () => ({ message: 'Cor de triagem inválida.' }) }
  ),
  queixaPrincipal: z
    .string()
    .min(5, 'Descreva a queixa principal.')
    .max(2000, 'Queixa principal muito longa.'),
  tempoQueixa: z.string().optional(),
  categoriaQueixa: z.string().optional(),
  
  doencasPreexistentes: z.string().optional(),
  medicacoes: z.string().optional(),
  alergias: z.string().optional(),
  acidenteTrabalho: z.boolean().default(false),
  
  regraDor: z.string().optional(),
  tipoDorToracica: z.enum(['NORMAL', 'QUEIMACAO', 'APERTO', 'PONTADA', '']).optional(),
  irradiacao: z.enum(['NORMAL', 'MEMBROS_SUPERIORES', 'MEMBROS_INFERIORES', 'PESCOCO', 'COSTAS', '']).optional(),

  duracaoDor: z.string().max(500).optional(),
  localizacaoDor: z.string().max(500).optional(),
  irradiacaoDorSites: z
    .array(
      z.enum([
        'BRACO_E',
        'BRACO_D',
        'ESCAPULA',
        'MANDIBULA',
        'TORAX_POSTERIOR',
        'ABDOME',
      ])
    )
    .optional(),

  estadoConscienciaSinais: z.array(schemaEstadoConscienciaSinaisKey).optional(),

  fluxograma: z.string().optional(),
  discriminador: z.string().optional(),
  especialidade: z.string().optional(),
  sinaisVitais: schemaSinaisVitais,
});

export const schemaChamarPaciente = z.object({
  atendimentoId: schemaIdEntidade,
  salaDestino: z.string().min(1, 'Informe a sala de destino.').max(50),
  setorPainel: z.string().min(1).max(50).default('GERAL'),
});

export type SinaisVitaisForm = z.infer<typeof schemaSinaisVitais>;
export type RegistrarTriagemForm = z.infer<typeof schemaRegistrarTriagem>;
export type ChamarPacienteForm = z.infer<typeof schemaChamarPaciente>;
