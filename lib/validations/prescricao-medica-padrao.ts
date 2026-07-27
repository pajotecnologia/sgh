import { z } from 'zod'
import { schemaItemPrescricaoInternacao } from '@/lib/validations/atendimento'

export const TIPOS_ITEM_PRESCRICAO_MEDICA = ['MEDICAMENTO', 'TEXTO_LIVRE', 'LINHA_DUPLA'] as const
export type TipoItemPrescricaoMedica = (typeof TIPOS_ITEM_PRESCRICAO_MEDICA)[number]

export const NOME_COLUNA_ESQUERDA_PADRAO = 'Prescrição médica'
export const NOME_COLUNA_DIREITA_PADRAO = 'Prescrição de medicamentos / enfermagem'

export const schemaItemPrescricaoMedicaPadraoMedicamento = schemaItemPrescricaoInternacao.extend({
  tipoItem: z.literal('MEDICAMENTO'),
})

export const schemaItemPrescricaoMedicaPadraoTextoLivre = z.object({
  tipoItem: z.literal('TEXTO_LIVRE'),
  nomeMedicamento: z
    .string()
    .min(2, 'Informe o texto da linha (mín. 2 caracteres).')
    .max(500, 'Texto muito longo (máx. 500 caracteres).'),
  principioAtivo: z.string().max(120).optional().or(z.literal('')),
  dose: z.string().optional().or(z.literal('')),
  unidadeMedida: z.string().optional().or(z.literal('')),
  via: z.string().optional().or(z.literal('')),
  frequencia: z.string().optional().or(z.literal('')),
  quantidadeSolicitada: z.number().optional(),
  duracaoDias: z.number().optional(),
  observacoes: z.string().max(1000).optional().or(z.literal('')),
})

/** Linha dupla: texto fixo à esquerda (cadastro) + campo à direita (médico na prescrição) */
export const schemaItemPrescricaoMedicaPadraoLinhaDupla = z.object({
  tipoItem: z.literal('LINHA_DUPLA'),
  nomeMedicamento: z
    .string()
    .min(1, 'Informe o texto da coluna esquerda.')
    .max(500, 'Texto muito longo (máx. 500 caracteres).'),
  observacoes: z
    .string()
    .max(2000, 'Texto da coluna direita muito longo (máx. 2000 caracteres).')
    .optional()
    .or(z.literal('')),
  principioAtivo: z.string().optional().or(z.literal('')),
  dose: z.string().optional().or(z.literal('')),
  unidadeMedida: z.string().optional().or(z.literal('')),
  via: z.string().optional().or(z.literal('')),
  frequencia: z.string().optional().or(z.literal('')),
  quantidadeSolicitada: z.number().optional(),
  duracaoDias: z.number().optional(),
})

export const schemaItemPrescricaoMedicaPadrao = z.discriminatedUnion('tipoItem', [
  schemaItemPrescricaoMedicaPadraoMedicamento,
  schemaItemPrescricaoMedicaPadraoTextoLivre,
  schemaItemPrescricaoMedicaPadraoLinhaDupla,
])

export const schemaCriarPrescricaoMedicaPadrao = z.object({
  nome: z.string().min(2, 'Nome obrigatório.').max(120),
  descricao: z.string().max(500).optional().or(z.literal('')),
  observacoesPadrao: z.string().max(2000).optional().or(z.literal('')),
  nomeColunaEsquerda: z
    .string()
    .min(2, 'Informe o nome da coluna esquerda.')
    .max(120)
    .optional()
    .default(NOME_COLUNA_ESQUERDA_PADRAO),
  nomeColunaDireita: z
    .string()
    .min(2, 'Informe o nome da coluna direita.')
    .max(120)
    .optional()
    .default(NOME_COLUNA_DIREITA_PADRAO),
  ativo: z.boolean().optional().default(true),
  itens: z
    .array(schemaItemPrescricaoMedicaPadrao)
    .min(1, 'Adicione pelo menos uma linha ao modelo.'),
})

export const schemaAtualizarPrescricaoMedicaPadrao = schemaCriarPrescricaoMedicaPadrao.partial().extend({
  itens: z.array(schemaItemPrescricaoMedicaPadrao).min(1).optional(),
})

export type ItemPrescricaoMedicaPadraoForm = z.infer<typeof schemaItemPrescricaoMedicaPadrao>
export type CriarPrescricaoMedicaPadraoForm = z.infer<typeof schemaCriarPrescricaoMedicaPadrao>
