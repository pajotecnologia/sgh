// lib/validations/atendimento.ts
// Schemas Zod para Módulo 4 — Atendimento Médico

import { z } from 'zod';
import { schemaIdEntidade } from '@/lib/validations/id';

// =============================================================================
// 4A — ANAMNESE
// =============================================================================
export const schemaAnamnese = z.object({
  atendimentoId: z.string().uuid(),
  queixaPrincipal: z.string().min(5, 'Descreva a queixa principal.').max(2000),
  hda: z.string().max(5000).optional().or(z.literal('')),
  antecedentesP: z.string().max(3000).optional().or(z.literal('')),
  antecedentesF: z.string().max(3000).optional().or(z.literal('')),
  antecedentesC: z.string().max(3000).optional().or(z.literal('')),
  habitosVida: z.object({
    tabagismo: z.boolean().optional(),
    etilismo: z.boolean().optional(),
    atividadeFisica: z.string().max(500).optional().or(z.literal('')),
    alimentacao: z.string().max(500).optional().or(z.literal('')),
  }).optional(),
  revisaoSistemas: z.record(z.string(), z.any()).optional(),
  exameFisico: z.record(z.string(), z.string()).optional(),
});

// =============================================================================
// 4B — DIAGNÓSTICO / CID-10
// =============================================================================
export const schemaDiagnostico = z.object({
  prontuarioId: z.string().uuid(),
  codigoCid: z.string().min(3, 'Código CID obrigatório.').max(10),
  descricaoCid: z.string().min(2).max(500),
  hipotese: z.string().max(2000).optional().or(z.literal('')),
  principal: z.boolean().default(false),
});

// =============================================================================
// 4C — PRESCRIÇÃO
// =============================================================================
/** Campo number vazio no browser vira NaN com valueAsNumber — tratar como “sem duração”. */
function preprocessDuracaoDiasItem(val: unknown) {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'number' && Number.isNaN(val)) return undefined;
  return val;
}

export const schemaItemPrescricao = z.object({
  nomeMedicamento: z.string().min(2, 'Nome do medicamento obrigatório.').max(200),
  /** Princípio ativo (para engine de interações + farmácia). Se vazio, o backend tentará inferir. */
  principioAtivo: z.string().max(120).optional().or(z.literal('')),
  dose: z.string().min(1, 'Dose obrigatória.').max(100),
  via: z.enum([
    'ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA',
    'TOPICA', 'INALATORIA', 'SUBLINGUAL', 'RETAL', 'OFTALMICA', 'OTOLOGICA', 'NASAL',
  ], { errorMap: () => ({ message: 'Via de administração inválida.' }) }),
  frequencia: z.string().min(2, 'Frequência obrigatória.').max(200),
  quantidadeSolicitada: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return 1
      if (typeof val === 'number' && Number.isNaN(val)) return 1
      const n = typeof val === 'string' ? Number(val) : val
      return n
    },
    z.number().int().min(1).max(999).default(1)
  ),
  duracaoDias: z.preprocess(
    preprocessDuracaoDiasItem,
    z.number().int().min(1).max(365).optional()
  ),
  observacoes: z.string().max(1000).optional().or(z.literal('')),
  unidadeMedida: z.string().max(30).optional().or(z.literal('')),
});

/** Item de prescrição na internação — exige unidade de medida */
export const schemaItemPrescricaoInternacao = schemaItemPrescricao.extend({
  unidadeMedida: z.string().min(1, 'Unidade de medida obrigatória.').max(30),
});

export const schemaCriarPrescricao = z.object({
  prontuarioId: z.string().uuid(),
  tipo: z.enum(['PS', 'RECEITA_ALTA']).default('PS'),
  observacoes: z.string().max(2000).optional().or(z.literal('')),
  /** Obrigatória quando há interação CRÍTICA e o médico decide prosseguir. */
  justificativaMedicaCritica: z.string().max(4000).optional().or(z.literal('')),
  /** Quando true, ignora o aviso de prescrição idêntica já emitida no mesmo dia. */
  confirmarDuplicada: z.boolean().optional(),
  itens: z
    .array(schemaItemPrescricao)
    .min(1, 'Adicione pelo menos um medicamento à prescrição.'),
});

// =============================================================================
// 4F — EVOLUÇÃO MÉDICA
// =============================================================================
export const schemaEvolucao = z.object({
  prontuarioId: z.string().uuid(),
  conteudo: z.string().min(10, 'Registro de evolução deve ter pelo menos 10 caracteres.').max(10000),
  template: z.enum(['SOAP', 'LIVRE']).default('LIVRE'),
});

// =============================================================================
// 4D — Aplicação de medicamento (enfermagem — 5 certos)
// =============================================================================
export const schemaChecklistCincoCertos = z.object({
  pacienteCerto: z.literal(true),
  medicamentoCerto: z.literal(true),
  doseCerta: z.literal(true),
  viaCerta: z.literal(true),
  horarioCerto: z.literal(true),
});

export const schemaAplicacaoMedicamento = z.object({
  itemPrescricaoId: schemaIdEntidade,
  doseAplicada: z.string().min(1).max(100),
  via: z.enum([
    'ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA',
    'TOPICA', 'INALATORIA', 'SUBLINGUAL', 'RETAL', 'OFTALMICA', 'OTOLOGICA', 'NASAL',
  ]),
  checklistConfirmado: schemaChecklistCincoCertos,
  observacoes: z.string().max(2000).optional().or(z.literal('')),
  /** medicacao = PS; internacao | enfermagem = paciente internado no prontuário */
  contexto: z.enum(['medicacao', 'enfermagem', 'internacao']).default('internacao'),
});

// =============================================================================
// 4E — Requisição de exames
// =============================================================================
export const schemaItemRequisicaoExame = z.object({
  nomeExame: z.string().min(2).max(300),
  codigoTuss: z.string().max(20).optional().or(z.literal('')),
  observacoes: z.string().max(1000).optional().or(z.literal('')),
});

export const schemaCriarRequisicaoExame = z.object({
  prontuarioId: z.string().uuid(),
  categoria: z.enum(['LABORATORIO', 'IMAGEM', 'CARDIOLOGIA', 'PROCEDIMENTO', 'OUTRO']),
  urgencia: z.enum(['ROTINA', 'URGENTE', 'EMERGENCIAL']).default('ROTINA'),
  indicacao: z.string().min(5).max(4000),
  itens: z.array(schemaItemRequisicaoExame).min(1, 'Informe pelo menos um exame.'),
});

/** Atualização de resultado do item de requisição (laboratório / imagem / etc.) */
export const schemaAtualizarItemExame = z.object({
  resultado: z.string().min(1, 'Informe o resultado.').max(15000),
  /** ISO ou valor de `datetime-local`; vazio = data/hora atual no servidor */
  realizadoEm: z.string().max(40).optional().or(z.literal('')),
});

// =============================================================================
// 4G — Encaminhamento
// =============================================================================
export const schemaEncaminhamento = z.object({
  prontuarioId: z.string().uuid(),
  tipo: z.enum(['EXTERNO', 'INTERNACAO']),
  especialidade: z.string().min(2).max(200),
  medicoDestinoId: z.string().uuid().optional().nullable(),
  prioridade: z.enum(['Alta', 'Média', 'Baixa']).optional().nullable(),
  resumoClinco: z.string().max(4000).optional().or(z.literal('')),
  justificativa: z.string().max(4000).optional().or(z.literal('')),
  cidInternacao: z.string().max(12).optional().or(z.literal('')),
});

// =============================================================================
// Tipos inferidos
// =============================================================================
export type AnamneseForm = z.infer<typeof schemaAnamnese>;
export type DiagnosticoForm = z.infer<typeof schemaDiagnostico>;
export type ItemPrescricaoForm = z.infer<typeof schemaItemPrescricao>;
export type CriarPrescricaoForm = z.infer<typeof schemaCriarPrescricao>;
export type EvolucaoForm = z.infer<typeof schemaEvolucao>;
export type AplicacaoMedicamentoForm = z.infer<typeof schemaAplicacaoMedicamento>;
export type CriarRequisicaoExameForm = z.infer<typeof schemaCriarRequisicaoExame>;
export type AtualizarItemExameForm = z.infer<typeof schemaAtualizarItemExame>;
export type EncaminhamentoForm = z.infer<typeof schemaEncaminhamento>;
