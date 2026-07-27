// lib/validations/ficha-internacao-alta.ts — Folha de Internação e Alta Hospitalar

import { z } from 'zod'

const textoOpcional = (max: number) => z.string().max(max).optional().or(z.literal(''))

const schemaNaturezaAcidente = z.object({
  casual: z.boolean().optional(),
  queda: z.boolean().optional(),
  acidenteTrabalho: z.boolean().optional(),
  acidenteTransito: z.boolean().optional(),
  intoxicacao: z.boolean().optional(),
  agressao: z.boolean().optional(),
  tentativaSuicidio: z.boolean().optional(),
  outrasCausas: z.boolean().optional(),
  outrasCausasTexto: textoOpcional(500),
})

const schemaEvolucaoLinha = z.object({
  data: textoOpcional(20),
  hora: textoOpcional(10),
  evolucaoClinica: textoOpcional(4000),
  relatorioEnfermagem: textoOpcional(4000),
})

export const schemaFichaInternacaoAlta = z.object({
  status: z.enum(['RASCUNHO', 'EM_ANDAMENTO', 'CONCLUIDA']).default('RASCUNHO'),
  registroNumero: textoOpcional(30),
  dataInternacao: textoOpcional(20),
  horaInternacao: textoOpcional(10),
  unidadeSaude: textoOpcional(300),
  nome: z.string().min(2, 'Nome do paciente obrigatório.').max(300),
  categoria: textoOpcional(100),
  sexo: textoOpcional(30),
  idade: textoOpcional(10),
  cor: textoOpcional(50),
  estadoCivil: textoOpcional(50),
  naturalidade: textoOpcional(200),
  profissao: textoOpcional(200),
  endereco: textoOpcional(500),
  procedencia: textoOpcional(300),
  responsavelPessoaDependente: textoOpcional(300),
  responsavelParentesco: textoOpcional(100),
  responsavelEndereco: textoOpcional(500),
  responsavelFone: textoOpcional(20),
  trazidoPor: textoOpcional(300),
  trazidoEndereco: textoOpcional(500),
  trazidoFone: textoOpcional(20),
  localAcidente: textoOpcional(300),
  dataAcidente: textoOpcional(20),
  horaAcidente: textoOpcional(10),
  naturezaAcidente: schemaNaturezaAcidente.optional(),
  atendimentoClinico: z.boolean().optional(),
  atendimentoCirurgico: z.boolean().optional(),
  historiaDoencaAtual: textoOpcional(8000),
  pressaoArterial: textoOpcional(30),
  pulso: textoOpcional(20),
  temperatura: textoOpcional(20),
  peso: textoOpcional(20),
  exameFisico: textoOpcional(8000),
  diagnosticoProvisorio: textoOpcional(2000),
  recepcionista: textoOpcional(200),
  medicoCremepe: textoOpcional(200),
  observacoesEnfermagem: textoOpcional(4000),
  evolucoes: z.array(schemaEvolucaoLinha).optional(),
  altaCurado: z.boolean().optional(),
  altaMelhorado: z.boolean().optional(),
  altaInternado: z.boolean().optional(),
  altaPiorado: z.boolean().optional(),
  obito: z.boolean().optional(),
  obitoData: textoOpcional(20),
  obitoHora: textoOpcional(10),
  obitoMais48h: z.boolean().optional(),
  obitoMenos48h: z.boolean().optional(),
  motivoDecisaoMedica: z.boolean().optional(),
  motivoAltaPedida: z.boolean().optional(),
  motivoTransferencia: z.boolean().optional(),
  motivoIndisciplina: z.boolean().optional(),
  transferenciaPara: textoOpcional(300),
  diagnosticoDefinitivo: textoOpcional(4000),
  observacaoAlta: textoOpcional(4000),
  dataAlta: textoOpcional(20),
  medicoCremepeAlta: textoOpcional(200),
})

export const schemaSalvarFichaInternacaoAlta = schemaFichaInternacaoAlta.extend({
  secaoSalvar: z.enum(['ADMISSAO', 'ALTA']).optional(),
})

export type FichaInternacaoAltaForm = z.infer<typeof schemaFichaInternacaoAlta>
export type SalvarFichaInternacaoAltaForm = z.infer<typeof schemaSalvarFichaInternacaoAlta>
