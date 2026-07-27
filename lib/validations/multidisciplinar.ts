// lib/validations/multidisciplinar.ts — Ficha multidisciplinar de internação

import { z } from 'zod'

const textoOpcional = (max: number) => z.string().max(max).optional().or(z.literal(''))

const dataOpcional = z.string().max(30).optional().or(z.literal(''))

export const schemaSecaoMedico = z.object({
  resumoClinico: textoOpcional(8000),
  conduta: textoOpcional(4000),
  prognostico: textoOpcional(2000),
  observacoes: textoOpcional(2000),
  nomeProfissional: textoOpcional(200),
  conselho: textoOpcional(30),
  dataAvaliacao: dataOpcional,
})

export const schemaSecaoEnfermagem = z.object({
  diagnosticoEnfermagem: textoOpcional(4000),
  intervencoes: textoOpcional(4000),
  integridadePele: textoOpcional(1000),
  mobilidade: textoOpcional(1000),
  eliminacoes: textoOpcional(1000),
  escalaBraden: textoOpcional(50),
  observacoes: textoOpcional(2000),
  nomeProfissional: textoOpcional(200),
  conselho: textoOpcional(30),
  dataAvaliacao: dataOpcional,
})

export const schemaSecaoNutricao = z.object({
  riscoNutricional: textoOpcional(500),
  dietaAtual: textoOpcional(1000),
  restricoes: textoOpcional(1000),
  condutaMetas: textoOpcional(4000),
  observacoes: textoOpcional(2000),
  nomeProfissional: textoOpcional(200),
  conselho: textoOpcional(30),
  dataAvaliacao: dataOpcional,
})

export const schemaSecaoFisioterapia = z.object({
  avaliacaoFuncional: textoOpcional(4000),
  condutaMetas: textoOpcional(4000),
  observacoes: textoOpcional(2000),
  nomeProfissional: textoOpcional(200),
  conselho: textoOpcional(30),
  dataAvaliacao: dataOpcional,
})

export const schemaSecaoPsicologia = z.object({
  aspectosPsicossociais: textoOpcional(4000),
  redeApoio: textoOpcional(2000),
  condutaOrientacoes: textoOpcional(4000),
  observacoes: textoOpcional(2000),
  nomeProfissional: textoOpcional(200),
  conselho: textoOpcional(30),
  dataAvaliacao: dataOpcional,
})

export const schemaSecaoFarmacia = z.object({
  reconciliacaoMedicamentosa: textoOpcional(4000),
  interacoesAlertas: textoOpcional(2000),
  orientacoes: textoOpcional(4000),
  observacoes: textoOpcional(2000),
  nomeProfissional: textoOpcional(200),
  conselho: textoOpcional(30),
  dataAvaliacao: dataOpcional,
})

export const schemaPlanoConjunto = z.object({
  dataReuniao: dataOpcional,
  metasEquipe: textoOpcional(4000),
  encaminhamentos: textoOpcional(4000),
  dataProximaRevisao: dataOpcional,
  observacoesGerais: textoOpcional(4000),
})

export const schemaFichaMultidisciplinar = z.object({
  status: z.enum(['RASCUNHO', 'EM_ANDAMENTO', 'CONCLUIDA']).default('RASCUNHO'),
  nomePaciente: z.string().min(2, 'Nome do paciente obrigatório.').max(300),
  numeroProntuario: textoOpcional(30),
  dataNascimento: z.string().min(8, 'Data de nascimento obrigatória.'),
  sexo: z.enum(['MASCULINO', 'FEMININO', 'INTERSEXO', 'NAO_INFORMADO'], {
    errorMap: () => ({ message: 'Selecione o sexo.' }),
  }),
  setorUnidade: textoOpcional(200),
  leitoDescricao: textoOpcional(200),
  dataInternacao: dataOpcional,
  diagnosticoPrincipal: textoOpcional(500),
  cidPrincipal: textoOpcional(10),
  medico: schemaSecaoMedico.optional(),
  enfermagem: schemaSecaoEnfermagem.optional(),
  nutricao: schemaSecaoNutricao.optional(),
  fisioterapia: schemaSecaoFisioterapia.optional(),
  psicologia: schemaSecaoPsicologia.optional(),
  farmacia: schemaSecaoFarmacia.optional(),
  planoConjunto: schemaPlanoConjunto.optional(),
})

export type FichaMultidisciplinarForm = z.infer<typeof schemaFichaMultidisciplinar>
