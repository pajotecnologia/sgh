// lib/validations/paciente.ts
// Schemas Zod para validação do Módulo 1 — Recepção / Ficha do Paciente

import { z } from 'zod';

// =============================================================================
// UTILITÁRIOS DE VALIDAÇÃO
// =============================================================================

/**
 * Valida CPF usando o algoritmo de dígitos verificadores.
 * Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11).
 */
function validarCPF(cpf: string): boolean {
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11) return false;
  // Rejeitar sequências inválidas (todos os dígitos iguais)
  if (/^(\d)\1+$/.test(limpo)) return false;

  // Calcular primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo[i]) * (10 - i);
  }
  let digito1 = 11 - (soma % 11);
  if (digito1 >= 10) digito1 = 0;

  // Calcular segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(limpo[i]) * (11 - i);
  }
  let digito2 = 11 - (soma % 11);
  if (digito2 >= 10) digito2 = 0;

  return (
    parseInt(limpo[9]) === digito1 && parseInt(limpo[10]) === digito2
  );
}

// =============================================================================
// SCHEMAS INDIVIDUAIS
// =============================================================================

export const schemaDadosPessoais = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres.')
    .max(200, 'Nome muito longo.')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome deve conter apenas letras.'),

  cpf: z
    .string()
    .min(1, 'CPF é obrigatório.')
    .refine(validarCPF, 'CPF inválido. Verifique o número digitado.'),

  rg: z
    .string()
    .max(20, 'RG muito longo.')
    .optional()
    .or(z.literal('')),

  dataNascimento: z
    .string()
    .min(1, 'Data de nascimento é obrigatória.')
    .refine((val) => {
      const data = new Date(val);
      const hoje = new Date();
      return data < hoje;
    }, 'Data de nascimento não pode ser no futuro.')
    .refine((val) => {
      const data = new Date(val);
      const anoMinimo = new Date();
      anoMinimo.setFullYear(anoMinimo.getFullYear() - 150);
      return data > anoMinimo;
    }, 'Data de nascimento inválida.'),

  sexoBiologico: z.enum(['MASCULINO', 'FEMININO', 'INTERSEXO'], {
    errorMap: () => ({ message: 'Sexo biológico inválido.' }),
  }),

  genero: z.string().max(100, 'Campo gênero muito longo.').optional().or(z.literal('')),

  telefone: z
    .string()
    .optional()
    .or(z.literal('')),

  naturalidade: z.string().max(100).optional().or(z.literal('')),
  nomeMae: z.string().max(200).optional().or(z.literal('')),
  escolaridade: z.string().max(100).optional().or(z.literal('')),
  racaCor: z.string().max(50).optional().or(z.literal('')),
  cns: z.string().max(20).optional().or(z.literal('')),
  profissao: z.string().max(100).optional().or(z.literal('')),
  acompanhanteNome: z.string().max(200).optional().or(z.literal('')),
  acompanhanteTelefone: z.string().max(20).optional().or(z.literal('')),
});

export const schemaEndereco = z.object({
  cep: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido. Use o formato 01310-100.'),

  logradouro: z.string().min(3, 'Logradouro obrigatório.').max(200),

  numero: z.string().min(1, 'Número obrigatório.').max(10),

  complemento: z.string().max(100).optional().or(z.literal('')),

  bairro: z.string().min(2, 'Bairro obrigatório.').max(100),

  cidade: z.string().min(2, 'Cidade obrigatória.').max(100),

  estado: z
    .string()
    .length(2, 'Estado deve ter 2 letras (ex: SP).')
    .regex(/^[A-Z]{2}$/, 'Estado inválido.'),
});

export const schemaAlergia = z.object({
  descricao: z.string().min(2, 'Descrição da alergia obrigatória.').max(100),
  gravidade: z.enum(['Leve', 'Moderada', 'Grave']).optional(),
});

export const schemaMedicamentoContinuo = z.object({
  nome: z.string().min(2, 'Nome do medicamento obrigatório.').max(200),
  dose: z.string().min(1, 'Dose obrigatória.').max(50),
  frequencia: z.string().min(2, 'Frequência obrigatória.').max(100),
  observacoes: z.string().max(500).optional().or(z.literal('')),
});

export const schemaDadosSaude = z.object({
  tipoSanguineo: z.enum([
    'A_POSITIVO', 'A_NEGATIVO', 'B_POSITIVO', 'B_NEGATIVO',
    'AB_POSITIVO', 'AB_NEGATIVO', 'O_POSITIVO', 'O_NEGATIVO', 'DESCONHECIDO',
  ]).default('DESCONHECIDO'),

  alergias: z.array(schemaAlergia).default([]),

  medicamentosContinuos: z.array(schemaMedicamentoContinuo).default([]),

  convenio: z.string().max(200).optional().or(z.literal('')),

  numeroCarteirinha: z.string().max(100).optional().or(z.literal('')),
});

// =============================================================================
// SCHEMA COMPLETO DE CADASTRO DE PACIENTE
// =============================================================================

export const schemaCriarPaciente = z.object({
  dadosPessoais: schemaDadosPessoais,
  endereco: schemaEndereco,
  dadosSaude: schemaDadosSaude,
  observacoesIniciais: z.string().max(2000).optional().or(z.literal('')),
});

// Schema para busca por CPF
export const schemaBuscaCpf = z.object({
  cpf: z
    .string()
    .min(1, 'CPF é obrigatório.')
    .refine(validarCPF, 'CPF inválido.'),
});

// Inferir tipos TypeScript a partir dos schemas
export type DadosPessoaisForm = z.infer<typeof schemaDadosPessoais>;
export type EnderecoForm = z.infer<typeof schemaEndereco>;
export type DadosSaudeForm = z.infer<typeof schemaDadosSaude>;
export type CriarPacienteForm = z.infer<typeof schemaCriarPaciente>;
