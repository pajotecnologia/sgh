// lib/laudo-solicitacao.ts
import { prisma } from '@/lib/prisma'
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao'
import type { LaudoSolicitacaoForm } from '@/lib/validations/laudo-solicitacao'

export type LaudoSolicitacaoPrefill = LaudoSolicitacaoForm & {
  id?: string
  atendimentoId: string
  numeroAtendimento: string
  setor?: string | null
  leito?: string | null
}

export async function carregarDadosLaudoSolicitacao(
  atendimentoId: string,
  usuario?: { nome?: string; crm?: string | null; cpf?: string | null }
): Promise<{
  prefill: LaudoSolicitacaoPrefill
  instituicao: {
    nomeInstituicao: string
    cnes?: string | null
    cnpj?: string | null
    endereco?: string | null
    logomarcaUrl?: string | null
  }
} | null> {
  const atendimento = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, deletedAt: null },
    include: {
      paciente: {
        select: {
          id: true,
          nomeExibicao: true,
          nomeCriptografado: true,
          acompanhanteNome: true,
          cns: true,
          dataNascimento: true,
          sexoBiologico: true,
        },
      },
      medico: {
        select: {
          id: true,
          nome: true,
          crm: true,
          cpf: true,
        },
      },
      leito: {
        select: {
          id: true,
          codigo: true,
          ala: true,
          quarto: true,
        },
      },
      laudoInternacao: {
        select: {
          id: true,
          codigoProcedimento: true,
          descricaoProcedimento: true,
        },
      },
      laudoSolicitacao: true,
    },
  })

  if (!atendimento || !atendimento.paciente) {
    return null
  }

  const inst = await prisma.instituicao.findFirst({
    select: {
      nomeInstituicao: true,
      cnes: true,
      endereco: true,
      logomarcaUrl: true,
    },
  })

  const instituicao = {
    nomeInstituicao: inst?.nomeInstituicao || 'HOSPITAL MUNICIPAL QUITÉRIA ALVES VILELA',
    cnes: inst?.cnes ?? '',
    cnpj: '',
    endereco: inst?.endereco ?? '',
    logomarcaUrl: inst?.logomarcaUrl ?? null,
  }

  const nomePaciente = nomeCompletoParaExibicao(
    atendimento.paciente.nomeExibicao,
    atendimento.paciente.nomeCriptografado
  )

  const salvo = atendimento.laudoSolicitacao

  const leitoDesc = atendimento.leito
    ? `${atendimento.leito.codigo}${atendimento.leito.ala ? ` (${atendimento.leito.ala})` : ''}`
    : atendimento.sala ?? null

  const prefill: LaudoSolicitacaoPrefill = {
    id: salvo?.id,
    atendimentoId: atendimento.id,
    numeroAtendimento: atendimento.numeroAtendimento,
    setor: atendimento.setor,
    leito: leitoDesc,
    status: (salvo?.status ?? 'RASCUNHO') as LaudoSolicitacaoForm['status'],

    // 1. Identificação Topo
    nomeHospital: salvo?.nomeHospital || instituicao.nomeInstituicao,
    cnpjHospital: salvo?.cnpjHospital || '',
    nomePaciente: salvo?.nomePaciente || nomePaciente,
    numeroAih: salvo?.numeroAih || atendimento.numeroAtendimento,
    procedimentoAnterior:
      salvo?.procedimentoAnterior ||
      (atendimento.laudoInternacao?.descricaoProcedimento
        ? `${atendimento.laudoInternacao.codigoProcedimento ? `${atendimento.laudoInternacao.codigoProcedimento} - ` : ''}${atendimento.laudoInternacao.descricaoProcedimento}`
        : ''),
    procedimentoSolicitado: salvo?.procedimentoSolicitado || '',
    nomeMedicoSolicitante:
      salvo?.nomeMedicoSolicitante ||
      usuario?.nome ||
      atendimento.medico?.nome ||
      '',
    crmMedicoSolicitante:
      salvo?.crmMedicoSolicitante ||
      usuario?.crm ||
      atendimento.medico?.crm ||
      '',
    cpfMedicoSolicitante:
      salvo?.cpfMedicoSolicitante ||
      usuario?.cpf ||
      atendimento.medico?.cpf ||
      '',

    // 2. Opções Meio
    mudancaProcedimento: salvo?.mudancaProcedimento ?? false,
    diariaUti: salvo?.diariaUti ?? false,
    diariaAcompanhante: salvo?.diariaAcompanhante ?? false,
    vacinaAntiRh: salvo?.vacinaAntiRh ?? false,
    usoProteseOtica: salvo?.usoProteseOtica ?? false,
    usoFatoresCoagulacao: salvo?.usoFatoresCoagulacao ?? false,
    usoOrdenadores: salvo?.usoOrdenadores ?? false,
    nutricaoParenteral: salvo?.nutricaoParenteral ?? false,

    // 3. Justificativa
    justificativa:
      salvo?.justificativa ?? '',

    // 4. Rodapé
    dataSolicitacao: salvo?.dataSolicitacao
      ? salvo.dataSolicitacao.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    nomeAcompanhante: salvo?.nomeAcompanhante || atendimento.paciente.acompanhanteNome || '',
    dataAuditoria: salvo?.dataAuditoria
      ? salvo.dataAuditoria.toISOString().split('T')[0]
      : '',
    parecerAuditor: salvo?.parecerAuditor || '',
    nomeAuditor: salvo?.nomeAuditor || '',
    crmAuditor: salvo?.crmAuditor || '',
  }

  return { prefill, instituicao }
}
