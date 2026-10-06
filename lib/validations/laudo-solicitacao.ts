// lib/validations/laudo-solicitacao.ts
import { z } from 'zod'

export const schemaLaudoSolicitacao = z.object({
  status: z.enum(['RASCUNHO', 'EMITIDO', 'AUDITADO', 'CANCELADO']).default('RASCUNHO'),
  
  // 1. Dados do Hospital, Paciente e Médico (Topo)
  nomeHospital: z.string().max(255).optional().nullable(),
  cnpjHospital: z.string().max(50).optional().nullable(),
  nomePaciente: z.string().max(255).optional().nullable(),
  numeroAih: z.string().max(50).optional().nullable(),
  procedimentoAnterior: z.string().max(255).optional().nullable(),
  procedimentoSolicitado: z.string().max(255).optional().nullable(),
  nomeMedicoSolicitante: z.string().max(255).optional().nullable(),
  crmMedicoSolicitante: z.string().max(50).optional().nullable(),
  cpfMedicoSolicitante: z.string().max(50).optional().nullable(),

  // 2. Opções de Solicitação (Meio)
  mudancaProcedimento: z.boolean().default(false),
  diariaUti: z.boolean().default(false),
  diariaAcompanhante: z.boolean().default(false),
  vacinaAntiRh: z.boolean().default(false),
  usoProteseOtica: z.boolean().default(false),
  usoFatoresCoagulacao: z.boolean().default(false),
  usoOrdenadores: z.boolean().default(false),
  nutricaoParenteral: z.boolean().default(false),

  // 3. Justificativa Aberta (Médico descreve)
  justificativa: z.string().optional().nullable(),

  // 4. Assinaturas e Auditoria (Rodapé)
  dataSolicitacao: z.string().optional().nullable(),
  nomeAcompanhante: z.string().max(255).optional().nullable(),
  dataAuditoria: z.string().optional().nullable(),
  parecerAuditor: z.string().optional().nullable(),
  nomeAuditor: z.string().max(255).optional().nullable(),
  crmAuditor: z.string().max(50).optional().nullable(),
})

export type LaudoSolicitacaoForm = z.infer<typeof schemaLaudoSolicitacao>
