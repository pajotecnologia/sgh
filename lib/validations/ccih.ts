// lib/validations/ccih.ts — Ficha de notificação CCIH (IRAS)

import { z } from 'zod'

const textoOpcional = (max: number) => z.string().max(max).optional().or(z.literal(''))

export const schemaControleInternoCcih = z.object({
  numero_controle: textoOpcional(50),
  numero_registro: textoOpcional(50),
})

export const schemaHospitalUnidadeCcih = z.object({
  clinica_servico: textoOpcional(200),
  andar_ala: textoOpcional(100),
  enfermaria_leito: textoOpcional(200),
})

export const schemaMedicoResponsavelCcih = z.object({
  nome: z.string().max(200).optional().or(z.literal('')),
  crm_carimbo: textoOpcional(30),
  assinatura_carimbo_digital: textoOpcional(500),
})

export const schemaObitoCcih = z.object({
  houve_obito: z.boolean().optional(),
  data: z.string().max(30).optional().or(z.literal('')),
  causa: textoOpcional(500),
  causa_relacionada_infeccao: z.boolean().optional(),
})

export const schemaPacienteInternacaoCcih = z.object({
  nome: z.string().min(2, 'Nome do paciente obrigatório.').max(300),
  prontuario: textoOpcional(30),
  sexo: textoOpcional(30),
  idade: z.number().int().min(0).max(150).nullable().optional(),
  idade_unidade: textoOpcional(20),
  nome_mae: textoOpcional(300),
  prontuario_mae: textoOpcional(30),
  clinica: textoOpcional(200),
  andar: textoOpcional(100),
  data_internacao: z.string().max(30).optional().or(z.literal('')),
  alta_em: z.string().max(30).optional().or(z.literal('')),
  obito: schemaObitoCcih.optional(),
  diagnostico: textoOpcional(500),
})

export const schemaDadosCirurgicosCcih = z.object({
  houve_cirurgia: z.boolean().optional(),
  nome_cirurgia: textoOpcional(500),
  descricao_cirurgia: textoOpcional(500),
  data_cirurgia: z.string().max(30).optional().or(z.literal('')),
  duracao_horas_minutos: textoOpcional(30),
  cirurgiao: textoOpcional(200),
  anestesista: textoOpcional(200),
  tipo_anestesia: textoOpcional(200),
  tipo_cirurgia: textoOpcional(200),
  classificacao_cirurgia: textoOpcional(200),
  utilizou_implante_protese: z.boolean().optional(),
})

export const schemaBolsaRotaCcih = z.object({
  apresentou: z.boolean().optional(),
  numero_horas: z.number().int().min(0).max(999).nullable().optional(),
  tempo_horas: z.number().int().min(0).max(999).nullable().optional(),
})

export const schemaDadosObstetricosCcih = z.object({
  parto_transpelvico: z.boolean().optional(),
  obstetra: textoOpcional(200),
  data: z.string().max(30).optional().or(z.literal('')),
  data_parto: z.string().max(30).optional().or(z.literal('')),
  bolsa_rota: schemaBolsaRotaCcih.optional(),
  episiorrafia: z.boolean().optional(),
  placenta: textoOpcional(300),
  placenta_completa: z.boolean().optional(),
})

export const schemaProcedimentosRiscoCcih = z.object({
  assistencia_ventilatoria: z.boolean().optional(),
  disseccao_venosa: z.boolean().optional(),
  puncao_lombar: z.boolean().optional(),
  biopsia: z.boolean().optional(),
  entubacao: z.boolean().optional(),
  puncao_toracica: z.boolean().optional(),
  cateterismo_vesical: z.boolean().optional(),
  npt: z.boolean().optional(),
  npt_nutricao_parenteral: z.boolean().optional(),
  hemotransfusao: z.boolean().optional(),
  cateterismo_venoso: z.boolean().optional(),
  nebulizacao: z.boolean().optional(),
  traqueostomia: z.boolean().optional(),
  puncao_venosa: z.boolean().optional(),
  puncao_abdominal: z.boolean().optional(),
  procedimento_complemento_texto: textoOpcional(500),
  outros_procedimentos_texto: textoOpcional(500),
})

export const schemaLocalizacaoTopograficaCcih = z.object({
  coto_umbilical: z.boolean().optional(),
  ocular: z.boolean().optional(),
  puerperal: z.boolean().optional(),
  cutanea_nao_cirurgica: z.boolean().optional(),
  ouvido: z.boolean().optional(),
  respiratoria: z.boolean().optional(),
  ferida_cirurgica: z.boolean().optional(),
  oral: z.boolean().optional(),
  urinaria: z.boolean().optional(),
  gastro_intestinal: z.boolean().optional(),
  peritonial: z.boolean().optional(),
  venosa_flebite: z.boolean().optional(),
  outras_topografias_texto: textoOpcional(300),
})

export const schemaInfeccaoNotificadaCcih = z.object({
  apresenta_infeccao: z.boolean().optional(),
  infeccao_opcao: z
    .enum(['SIM', 'NAO', 'COMUNITARIA', 'HOSPITALAR', 'AMBAS', ''])
    .optional()
    .or(z.literal('')),
  origem_infeccao: textoOpcional(100),
  classificacao: textoOpcional(200),
  localizacao_topografica: schemaLocalizacaoTopograficaCcih.optional(),
})

export const schemaGermeCcih = z.object({
  nome_microorganismo: textoOpcional(200),
  antibiograma_sensibilidade: textoOpcional(2000),
})

export const schemaGermesCulturaCcih = z.object({
  germe_1: schemaGermeCcih.optional(),
  germe_2: schemaGermeCcih.optional(),
  germe_3: schemaGermeCcih.optional(),
})

export const schemaMedicamentoAntimicrobianoCcih = z.object({
  tipo_nome: textoOpcional(200),
  nome_antimicrobiano: textoOpcional(200),
  dose: textoOpcional(100),
  dose_posologia: textoOpcional(200),
  data_inicio: z.string().max(30).optional().or(z.literal('')),
  data_termino: z.string().max(30).optional().or(z.literal('')),
})

export const schemaUsoAntimicrobianosCcih = z.object({
  houve_uso: z.boolean().optional(),
  uso_antimicrobiano: textoOpcional(500),
  finalidade: textoOpcional(300),
  medicamentos: z.array(schemaMedicamentoAntimicrobianoCcih).optional(),
})

export const schemaDadosCulturaCcih = z.object({
  realizada: z.boolean().optional(),
  cultura_realizada: z.boolean().optional(),
  tipos: textoOpcional(300),
  tipo_material_coletado: textoOpcional(300),
  data_coleta: z.string().max(30).optional().or(z.literal('')),
  resultados: textoOpcional(8000),
  observacoes_laboratorio: textoOpcional(4000),
  germes: schemaGermesCulturaCcih.optional(),
})

export const schemaFormularioCcihNotificacao = z.object({
  controle_interno: schemaControleInternoCcih.optional(),
  hospital: textoOpcional(300),
  hospital_unidade: schemaHospitalUnidadeCcih.optional(),
  data_notificacao: z.string().max(30).optional().or(z.literal('')),
  medico_responsavel: schemaMedicoResponsavelCcih.optional(),
  paciente_internacao: schemaPacienteInternacaoCcih,
  dados_cirurgicos: schemaDadosCirurgicosCcih.optional(),
  dados_obstetricos: schemaDadosObstetricosCcih.optional(),
  procedimentos_risco_realizados: schemaProcedimentosRiscoCcih.optional(),
  infeccao_notificada: schemaInfeccaoNotificadaCcih.optional(),
  uso_antimicrobianos: schemaUsoAntimicrobianosCcih.optional(),
  dados_cultura: schemaDadosCulturaCcih.optional(),
})

export const schemaFichaCcih = z.object({
  status: z.enum(['RASCUNHO', 'NOTIFICADO', 'EM_ANALISE', 'CONCLUIDO']).default('RASCUNHO'),
  formulario: schemaFormularioCcihNotificacao,
  observacoesEquipe: textoOpcional(4000),
  parecerCcih: textoOpcional(4000),
})

export type FormularioCcihNotificacao = z.infer<typeof schemaFormularioCcihNotificacao>
export type FichaCcihForm = z.infer<typeof schemaFichaCcih>
