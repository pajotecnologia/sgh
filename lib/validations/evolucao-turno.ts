// lib/validations/evolucao-turno.ts

import { z } from 'zod'

const textoOpcional = (max: number) => z.string().max(max).optional().or(z.literal(''))

export const schemaSinaisVitaisEvolucao = z.object({
  paSistolica: textoOpcional(4),
  paDiastolica: textoOpcional(4),
  frequenciaCardiaca: textoOpcional(4),
  frequenciaResp: textoOpcional(4),
  spo2: textoOpcional(4),
  temperatura: textoOpcional(6),
  glicemia: textoOpcional(4),
})

export const schemaFichaEvolucaoTurno = z.object({
  id: z.string().uuid().optional(),
  turno: z.enum(['DIURNA', 'NOTURNA'], {
    errorMap: () => ({ message: 'Selecione o turno (diurna ou noturna).' }),
  }),
  dataReferencia: z.string().min(8, 'Informe a data do turno.'),
  status: z.enum(['RASCUNHO', 'REGISTRADA']).default('RASCUNHO'),
  nomePaciente: z.string().min(2, 'Nome do paciente obrigatório.').max(300),
  numeroProntuario: textoOpcional(30),
  setorUnidade: textoOpcional(200),
  leitoDescricao: textoOpcional(200),
  estadoGeral: textoOpcional(2000),
  evolucaoClinica: textoOpcional(12000),
  exameFisico: textoOpcional(8000),
  sinaisVitais: schemaSinaisVitaisEvolucao.optional(),
  avaliacaoSistemas: z.record(z.string(), z.string().max(500)).optional(),
  dietaEliminacoes: textoOpcional(4000),
  medicamentosProcedimentos: textoOpcional(8000),
  intercorrencias: textoOpcional(4000),
  condutaProximoTurno: textoOpcional(4000),
  nomeProfissional: z.string().min(2, 'Nome do profissional obrigatório.').max(200),
  conselhoProfissional: textoOpcional(30),
  funcaoProfissional: z.enum(['MEDICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'OUTRO']).optional().nullable(),
})

export type FichaEvolucaoTurnoForm = z.infer<typeof schemaFichaEvolucaoTurno>
