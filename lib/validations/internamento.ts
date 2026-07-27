// lib/validations/internamento.ts — Laudo SUS de internação hospitalar

import { z } from 'zod'
import { validarDocumentoCpfSeAplicavel } from '@/lib/validar-cpf'

const textoOpcional = (max: number) => z.string().max(max).optional().or(z.literal(''))

export const schemaCausasExternas = z.object({
  acidenteTransito: z.boolean().optional(),
  acidenteTrabalhoTipico: z.boolean().optional(),
  acidenteTrabalhoTrajeto: z.boolean().optional(),
  cnpjSeguradora: textoOpcional(18),
  numeroBilhete: textoOpcional(40),
  serieBilhete: textoOpcional(20),
  cnpjEmpresa: textoOpcional(18),
  cnaeEmpresa: textoOpcional(10),
  cbor: textoOpcional(10),
  vinculoPrevidencia: z
    .enum([
      'EMPREGADO',
      'EMPREGADOR',
      'AUTONOMO',
      'DESEMPREGADO',
      'APOSENTADO',
      'NAO_SEGURADO',
    ])
    .optional()
    .nullable(),
}).optional()

export const schemaAutorizacaoLaudo = z.object({
  nomeProfissionalAutorizador: textoOpcional(200),
  codOrgaoEmissor: textoOpcional(20),
  numeroAutorizacao: textoOpcional(30),
  documentoTipo: z.enum(['CNS', 'CPF']).optional().nullable(),
  documentoNumero: textoOpcional(20),
  dataAutorizacao: z.string().max(30).optional().or(z.literal('')),
  registroConselho: textoOpcional(30),
  dataAdmissao: z.string().max(30).optional().or(z.literal('')),
  dataAlta: z.string().max(30).optional().or(z.literal('')),
  enfermariaLeito: textoOpcional(200),
}).optional()

export const schemaLaudoInternacao = z.object({
  status: z.enum(['RASCUNHO', 'SOLICITADO', 'AUTORIZADO']).default('RASCUNHO'),
  nomeEstabelecimentoSolicitante: textoOpcional(300),
  cnesSolicitante: textoOpcional(7),
  nomeEstabelecimentoExecutante: textoOpcional(300),
  cnesExecutante: textoOpcional(7),
  nomePaciente: z.string().min(2, 'Nome do paciente obrigatório.').max(300),
  numeroProntuario: textoOpcional(30),
  cns: textoOpcional(20),
  dataNascimento: z.string().min(8, 'Data de nascimento obrigatória.'),
  sexoCodigo: z.enum(['1', '3'], { errorMap: () => ({ message: 'Selecione o sexo.' }) }),
  nomeMae: textoOpcional(300),
  telefoneDdd: textoOpcional(3),
  telefoneNumero: textoOpcional(15),
  enderecoCompleto: textoOpcional(500),
  municipioResidencia: textoOpcional(200),
  codigoIbgeMunicipio: textoOpcional(7),
  uf: z.string().length(2, 'UF deve ter 2 letras.').optional().or(z.literal('')),
  cep: textoOpcional(9),
  sinaisSintomas: z.string().min(5, 'Descreva sinais e sintomas (mín. 5 caracteres).').max(8000),
  condicoesJustificativa: z.string().min(5, 'Descreva as condições que justificam a internação.').max(8000),
  resultadosDiagnosticos: textoOpcional(8000),
  diagnosticoInicial: textoOpcional(2000),
  cidPrincipal: z.string().min(3, 'CID principal obrigatório.').max(10),
  cidSecundario: textoOpcional(10),
  cidAssociadas: textoOpcional(50),
  descricaoProcedimento: z.string().min(3, 'Descrição do procedimento obrigatória.').max(500),
  codigoProcedimento: textoOpcional(20),
  clinica: textoOpcional(100),
  caraterInternacao: z.enum(['URGENCIA', 'ELETIVA'], {
    errorMap: () => ({ message: 'Selecione o caráter da internação.' }),
  }),
  documentoProfissionalTipo: z.enum(['CNS', 'CPF']).optional().nullable(),
  documentoProfissionalNumero: textoOpcional(20),
  nomeProfissionalSolicitante: z.string().min(2, 'Nome do profissional solicitante obrigatório.').max(200),
  dataSolicitacao: z.string().min(8, 'Data da solicitação obrigatória.'),
  registroConselho: textoOpcional(30),
  causasExternas: schemaCausasExternas,
  autorizacao: schemaAutorizacaoLaudo,
}).superRefine((dados, ctx) => {
  if (
    !validarDocumentoCpfSeAplicavel(
      dados.documentoProfissionalTipo,
      dados.documentoProfissionalNumero
    )
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'CPF do profissional solicitante inválido.',
      path: ['documentoProfissionalNumero'],
    })
  }
  const aut = dados.autorizacao
  if (
    aut &&
    !validarDocumentoCpfSeAplicavel(aut.documentoTipo, aut.documentoNumero)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'CPF do profissional autorizador inválido.',
      path: ['autorizacao', 'documentoNumero'],
    })
  }
})

export type LaudoInternacaoForm = z.infer<typeof schemaLaudoInternacao>
