// lib/laudo-solicitacao.ts — Carregamento e autopreenchimento completo de dados para Laudo de Solicitação

import { prisma } from '@/lib/prisma'
import { obterNomeCompletoPaciente } from '@/lib/nome-paciente-exibicao'
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
    where: {
      deletedAt: null,
      OR: [
        { id: atendimentoId },
        { numeroAtendimento: atendimentoId },
      ],
    },
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
      fichaInternacaoAlta: true,
      triagem: {
        select: {
          queixaPrincipal: true,
          corClassificacao: true,
        },
      },
      prontuario: {
        include: {
          diagnosticos: {
            orderBy: [{ principal: 'desc' }, { createdAt: 'desc' }],
            take: 3,
          },
          anamnese: true,
        },
      },
    },
  })

  if (!atendimento || !atendimento.paciente) {
    return null
  }

  const inst = await prisma.instituicao.findFirst({
    select: {
      nomeInstituicao: true,
      nomeMunicipio: true,
      cnes: true,
      endereco: true,
      logomarcaUrl: true,
    },
  })

  const nomeInstituicaoPadrao =
    inst?.nomeInstituicao?.trim() ||
    (inst?.nomeMunicipio ? `HOSPITAL MUNICIPAL DE ${inst.nomeMunicipio.toUpperCase()}` : 'HOSPITAL MUNICIPAL QUITÉRIA ALVES VILELA')

  const cnpjPadrao = (inst as any)?.cnpj?.trim() || '10.428.188/0001-08'

  const instituicao = {
    nomeInstituicao: nomeInstituicaoPadrao,
    cnes: inst?.cnes ?? '',
    cnpj: cnpjPadrao,
    endereco: inst?.endereco ?? '',
    logomarcaUrl: inst?.logomarcaUrl ?? null,
  }

  const nomePaciente =
    obterNomeCompletoPaciente(
      atendimento.paciente.nomeExibicao,
      atendimento.paciente.nomeCriptografado
    ) || atendimento.paciente.nomeExibicao

  const salvo = atendimento.laudoSolicitacao
  const fichaInternacaoDados = (atendimento.fichaInternacaoAlta?.dadosFormulario as Record<string, any>) || {}

  const leitoDesc = atendimento.leito
    ? `${atendimento.leito.codigo}${atendimento.leito.ala ? ` (${atendimento.leito.ala})` : ''}`
    : atendimento.sala ?? null

  const diagPrincipal = atendimento.prontuario?.diagnosticos?.[0]
  const diagTexto = diagPrincipal
    ? `${diagPrincipal.codigoCid ? `${diagPrincipal.codigoCid} - ` : ''}${diagPrincipal.descricaoCid}`
    : ''

  const procedimentoAnteriorPadrao =
    atendimento.laudoInternacao?.descricaoProcedimento
      ? `${atendimento.laudoInternacao.codigoProcedimento ? `${atendimento.laudoInternacao.codigoProcedimento} - ` : ''}${atendimento.laudoInternacao.descricaoProcedimento}`
      : fichaInternacaoDados.procedimento || fichaInternacaoDados.procedimentoPrincipal || diagTexto || 'Tratamento Clínico Hospitalar'

  const procedimentoSolicitadoPadrao =
    salvo?.procedimentoSolicitado?.trim() ||
    atendimento.laudoInternacao?.descricaoProcedimento ||
    fichaInternacaoDados.procedimento ||
    (diagTexto ? `Continuidade Assistencial / Tratamento Clínico em ${diagTexto}` : 'Continuidade Assistencial e Suporte Clínico Hospitalar')

  const nomeAcompanhantePadrao =
    salvo?.nomeAcompanhante?.trim() ||
    atendimento.paciente.acompanhanteNome?.trim() ||
    fichaInternacaoDados.responsavelNome?.trim() ||
    fichaInternacaoDados.acompanhanteNome?.trim() ||
    ''

  const justificativaPadrao =
    salvo?.justificativa?.trim() ||
    (diagTexto
      ? `Solicitação médica fundamentada na evolução clínica do paciente com diagnóstico de ${diagTexto}, necessitando de suporte e continuidade da assistência hospitalar especializada.`
      : atendimento.triagem?.queixaPrincipal
      ? `Solicitação médica referente à admissão por: ${atendimento.triagem.queixaPrincipal}.`
      : 'Paciente em regime de internação hospitalar necessitando de continuidade da assistência médica, monitorização clínica e execução de procedimentos indicados.')

  const prefill: LaudoSolicitacaoPrefill = {
    id: salvo?.id,
    atendimentoId: atendimento.id,
    numeroAtendimento: atendimento.numeroAtendimento,
    setor: atendimento.setor,
    leito: leitoDesc,
    status: (salvo?.status ?? 'RASCUNHO') as LaudoSolicitacaoForm['status'],

    // 1. Identificação Topo
    nomeHospital: salvo?.nomeHospital?.trim() || instituicao.nomeInstituicao,
    cnpjHospital: salvo?.cnpjHospital?.trim() || instituicao.cnpj || '10.428.188/0001-08',
    nomePaciente: salvo?.nomePaciente?.trim() || nomePaciente,
    numeroAih: salvo?.numeroAih?.trim() || fichaInternacaoDados.numeroAih || fichaInternacaoDados.aih || atendimento.numeroAtendimento,
    procedimentoAnterior: salvo?.procedimentoAnterior?.trim() || procedimentoAnteriorPadrao,
    procedimentoSolicitado: procedimentoSolicitadoPadrao,
    nomeMedicoSolicitante:
      salvo?.nomeMedicoSolicitante?.trim() ||
      atendimento.medico?.nome?.trim() ||
      usuario?.nome?.trim() ||
      'Dr(a). Plantonista / Responsável',
    crmMedicoSolicitante:
      salvo?.crmMedicoSolicitante?.trim() ||
      atendimento.medico?.crm?.trim() ||
      usuario?.crm?.trim() ||
      '',
    cpfMedicoSolicitante:
      salvo?.cpfMedicoSolicitante?.trim() ||
      atendimento.medico?.cpf?.trim() ||
      usuario?.cpf?.trim() ||
      '',

    // 2. Opções Meio
    mudancaProcedimento: salvo?.mudancaProcedimento ?? false,
    diariaUti: salvo?.diariaUti ?? false,
    diariaAcompanhante: salvo?.diariaAcompanhante ?? (Boolean(nomeAcompanhantePadrao)),
    vacinaAntiRh: salvo?.vacinaAntiRh ?? false,
    usoProteseOtica: salvo?.usoProteseOtica ?? false,
    usoFatoresCoagulacao: salvo?.usoFatoresCoagulacao ?? false,
    usoOrdenadores: salvo?.usoOrdenadores ?? false,
    nutricaoParenteral: salvo?.nutricaoParenteral ?? false,

    // 3. Justificativa
    justificativa: justificativaPadrao,

    // 4. Rodapé
    dataSolicitacao: salvo?.dataSolicitacao
      ? salvo.dataSolicitacao.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    nomeAcompanhante: nomeAcompanhantePadrao,
    dataAuditoria: salvo?.dataAuditoria
      ? salvo.dataAuditoria.toISOString().split('T')[0]
      : '',
    parecerAuditor: salvo?.parecerAuditor || '',
    nomeAuditor: salvo?.nomeAuditor || '',
    crmAuditor: salvo?.crmAuditor || '',
  }

  return { prefill, instituicao }
}
