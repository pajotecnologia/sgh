// lib/validations/laudo-solicitacao.ts
import { z } from 'zod'

export const schemaLaudoSolicitacao = z.object({
  status: z.enum(['RASCUNHO', 'EMITIDO', 'AUDITADO', 'CANCELADO']).default('RASCUNHO'),
  
  // 1. Dados do Hospital, Paciente e Médico (Topo)
  nomeHospital: z.string().max(500).optional().nullable(),
  cnpjHospital: z.string().max(100).optional().nullable(),
  nomePaciente: z.string().max(500).optional().nullable(),
  numeroAih: z.string().max(100).optional().nullable(),
  procedimentoAnterior: z.string().max(1000).optional().nullable(),
  procedimentoSolicitado: z.string().max(1000).optional().nullable(),
  nomeMedicoSolicitante: z.string().max(500).optional().nullable(),
  crmMedicoSolicitante: z.string().max(100).optional().nullable(),
  cpfMedicoSolicitante: z.string().max(100).optional().nullable(),

  // 2. Opções de Solicitação (Meio)
  mudancaProcedimento: z.coerce.boolean().default(false),
  diariaUti: z.coerce.boolean().default(false),
  diariaAcompanhante: z.coerce.boolean().default(false),
  vacinaAntiRh: z.coerce.boolean().default(false),
  usoProteseOtica: z.coerce.boolean().default(false),
  usoFatoresCoagulacao: z.coerce.boolean().default(false),
  usoOrdenadores: z.coerce.boolean().default(false),
  nutricaoParenteral: z.coerce.boolean().default(false),

  // 3. Justificativa Aberta (Médico descreve)
  justificativa: z.string().optional().nullable(),

  // 4. Assinaturas e Auditoria (Rodapé)
  dataSolicitacao: z.string().optional().nullable(),
  nomeAcompanhante: z.string().max(500).optional().nullable(),
  dataAuditoria: z.string().optional().nullable(),
  parecerAuditor: z.string().optional().nullable(),
  nomeAuditor: z.string().max(500).optional().nullable(),
  crmAuditor: z.string().max(100).optional().nullable(),
})

export type LaudoSolicitacaoForm = z.infer<typeof schemaLaudoSolicitacao>
