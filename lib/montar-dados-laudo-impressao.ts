// lib/montar-dados-laudo-impressao.ts — Dados para impressão do laudo SUS de internação

import { format } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { montarPrefillLaudoInternacao } from '@/lib/laudo-internacao'
import {
  dataInternacaoReferencia,
  descricaoLeitoInternacao,
} from '@/lib/prefill-internamento'
import type { LaudoInternacao, Instituicao } from '@prisma/client'

const includeAtendimento = {
  paciente: { include: { endereco: true } },
  medico: { select: { nome: true, crm: true } },
  leito: { select: { ala: true, quarto: true, codigo: true, tipo: true } },
  triagem: { select: { queixaPrincipal: true, sinaisVitais: true } },
  prontuario: {
    include: {
      anamnese: true,
      diagnosticos: { orderBy: { principal: 'desc' as const } },
      encaminhamentos: { orderBy: { createdAt: 'desc' as const } },
      requisicoes: {
        include: { itens: { select: { nomeExame: true, resultado: true } } },
      },
    },
  },
  laudoInternacao: true,
}

export type LaudoInternacaoImpressaoDados = {
  instituicao: {
    nomeMunicipio: string
    nomeInstituicao: string
    logomarcaUrl: string | null
  }
  nomeEstabelecimentoSolicitante: string
  cnesSolicitante: string
  nomeEstabelecimentoExecutante: string
  cnesExecutante: string
  nomePaciente: string
  numeroProntuario: string
  cns: string
  dataNascimento: string
  sexoCodigo: string
  nomeMae: string
  telefoneDdd: string
  telefoneNumero: string
  enderecoCompleto: string
  municipioResidencia: string
  codigoIbgeMunicipio: string
  uf: string
  cep: string
  sinaisSintomas: string
  condicoesJustificativa: string
  resultadosDiagnosticos: string
  diagnosticoInicial: string
  cidPrincipal: string
  cidSecundario: string
  cidAssociadas: string
  descricaoProcedimento: string
  codigoProcedimento: string
  clinica: string
  caraterInternacao: string
  documentoProfissionalTipo: string
  documentoProfissionalNumero: string
  nomeProfissionalSolicitante: string
  dataSolicitacao: string
  registroConselho: string
  causasExternas: Record<string, unknown>
  autorizacao: Record<string, unknown>
  dataAutorizacaoFmt: string
  dataAdmissaoFmt: string
  dataAltaFmt: string
  enfermariaLeito: string
}

function fmtData(d: Date | string | null | undefined): string {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d.includes('T') ? d : `${d}T12:00:00`) : d
  if (Number.isNaN(dt.getTime())) return ''
  return format(dt, 'dd/MM/yyyy')
}

function labelCarater(c: string | null | undefined): string {
  if (c === 'ELETIVA') return 'Eletiva'
  if (c === 'URGENCIA') return 'Urgência / Emergência'
  return c ?? ''
}

function fmtDataCampo(valor: unknown): string {
  if (!valor) return ''
  if (typeof valor === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(valor)) return fmtData(valor)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) return valor
    return valor
  }
  if (valor instanceof Date) return fmtData(valor)
  return String(valor)
}

function camposInternacaoAutorizacao(
  aut: Record<string, unknown>,
  fallback?: { dataAdmissao: string; enfermariaLeito: string }
) {
  const dataAdmissao = fmtDataCampo(aut.dataAdmissao) || fallback?.dataAdmissao || ''
  const dataAlta = fmtDataCampo(aut.dataAlta)
  const enfermariaLeito = String(aut.enfermariaLeito ?? '') || fallback?.enfermariaLeito || ''
  const dataAutorizacaoFmt = fmtDataCampo(aut.dataAutorizacao)

  return { dataAdmissaoFmt: dataAdmissao, dataAltaFmt: dataAlta, enfermariaLeito, dataAutorizacaoFmt }
}

function laudoParaImpressao(
  laudo: LaudoInternacao,
  inst: Instituicao | null,
  fallbackInternacao?: { dataAdmissao: string; enfermariaLeito: string }
): LaudoInternacaoImpressaoDados {
  const ce = (laudo.causasExternas ?? {}) as Record<string, unknown>
  const aut = (laudo.autorizacao ?? {}) as Record<string, unknown>
  const internacao = camposInternacaoAutorizacao(aut, fallbackInternacao)

  return {
    instituicao: {
      nomeMunicipio: inst?.nomeMunicipio ?? '',
      nomeInstituicao: inst?.nomeInstituicao ?? '',
      logomarcaUrl: inst?.logomarcaUrl ?? null,
    },
    nomeEstabelecimentoSolicitante: laudo.nomeEstabelecimentoSolicitante ?? '',
    cnesSolicitante: laudo.cnesSolicitante ?? inst?.cnes ?? '',
    nomeEstabelecimentoExecutante: laudo.nomeEstabelecimentoExecutante ?? '',
    cnesExecutante: laudo.cnesExecutante ?? inst?.cnes ?? '',
    nomePaciente: laudo.nomePaciente ?? '',
    numeroProntuario: laudo.numeroProntuario ?? '',
    cns: laudo.cns ?? '',
    dataNascimento: fmtData(laudo.dataNascimento),
    sexoCodigo: laudo.sexoCodigo ?? '1',
    nomeMae: laudo.nomeMae ?? '',
    telefoneDdd: laudo.telefoneDdd ?? '',
    telefoneNumero: laudo.telefoneNumero ?? '',
    enderecoCompleto: laudo.enderecoCompleto ?? '',
    municipioResidencia: laudo.municipioResidencia ?? '',
    codigoIbgeMunicipio: laudo.codigoIbgeMunicipio ?? inst?.codigoIbgeMunicipio ?? '',
    uf: laudo.uf ?? '',
    cep: laudo.cep ?? '',
    sinaisSintomas: laudo.sinaisSintomas ?? '',
    condicoesJustificativa: laudo.condicoesJustificativa ?? '',
    resultadosDiagnosticos: laudo.resultadosDiagnosticos ?? '',
    diagnosticoInicial: laudo.diagnosticoInicial ?? '',
    cidPrincipal: laudo.cidPrincipal ?? '',
    cidSecundario: laudo.cidSecundario ?? '',
    cidAssociadas: laudo.cidAssociadas ?? '',
    descricaoProcedimento: laudo.descricaoProcedimento ?? '',
    codigoProcedimento: laudo.codigoProcedimento ?? '',
    clinica: laudo.clinica ?? '',
    caraterInternacao: labelCarater(laudo.caraterInternacao),
    documentoProfissionalTipo: laudo.documentoProfissionalTipo ?? '',
    documentoProfissionalNumero: laudo.documentoProfissionalNumero ?? '',
    nomeProfissionalSolicitante: laudo.nomeProfissionalSolicitante ?? '',
    dataSolicitacao: fmtData(laudo.dataSolicitacao),
    registroConselho: laudo.registroConselho ?? '',
    causasExternas: ce,
    autorizacao: aut,
    ...internacao,
  }
}

function prefillParaImpressao(
  prefill: ReturnType<typeof montarPrefillLaudoInternacao>,
  inst: Instituicao | null,
  laudoParcial: LaudoInternacao | null,
  fallbackInternacao?: { dataAdmissao: string; enfermariaLeito: string }
): LaudoInternacaoImpressaoDados {
  if (laudoParcial) return laudoParaImpressao(laudoParcial, inst, fallbackInternacao)

  const ce = {} as Record<string, unknown>
  const aut = {} as Record<string, unknown>
  const internacao = camposInternacaoAutorizacao(aut, fallbackInternacao)

  return {
    instituicao: {
      nomeMunicipio: inst?.nomeMunicipio ?? '',
      nomeInstituicao: inst?.nomeInstituicao ?? '',
      logomarcaUrl: inst?.logomarcaUrl ?? null,
    },
    nomeEstabelecimentoSolicitante: prefill.nomeEstabelecimentoSolicitante,
    cnesSolicitante: prefill.cnesSolicitante,
    nomeEstabelecimentoExecutante: prefill.nomeEstabelecimentoExecutante,
    cnesExecutante: prefill.cnesExecutante,
    nomePaciente: prefill.nomePaciente,
    numeroProntuario: prefill.numeroProntuario,
    cns: prefill.cns,
    dataNascimento: fmtData(prefill.dataNascimento),
    sexoCodigo: prefill.sexoCodigo,
    nomeMae: prefill.nomeMae,
    telefoneDdd: prefill.telefoneDdd,
    telefoneNumero: prefill.telefoneNumero,
    enderecoCompleto: prefill.enderecoCompleto,
    municipioResidencia: prefill.municipioResidencia,
    codigoIbgeMunicipio: prefill.codigoIbgeMunicipio,
    uf: prefill.uf,
    cep: prefill.cep,
    sinaisSintomas: prefill.sinaisSintomas,
    condicoesJustificativa: prefill.condicoesJustificativa,
    resultadosDiagnosticos: prefill.resultadosDiagnosticos,
    diagnosticoInicial: prefill.diagnosticoInicial,
    cidPrincipal: prefill.cidPrincipal,
    cidSecundario: prefill.cidSecundario,
    cidAssociadas: prefill.cidAssociadas,
    descricaoProcedimento: prefill.descricaoProcedimento,
    codigoProcedimento: '',
    clinica: prefill.clinica,
    caraterInternacao: labelCarater(prefill.caraterInternacao),
    documentoProfissionalTipo: '',
    documentoProfissionalNumero: '',
    nomeProfissionalSolicitante: prefill.nomeProfissionalSolicitante,
    dataSolicitacao: fmtData(prefill.dataSolicitacao),
    registroConselho: prefill.registroConselho,
    causasExternas: ce,
    autorizacao: aut,
    ...internacao,
  }
}

export async function montarDadosLaudoInternacaoImpressao(
  atendimentoId: string,
  usuario: { nome: string; crm?: string | null }
): Promise<LaudoInternacaoImpressaoDados | null> {
  const atendimento = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, deletedAt: null, status: 'INTERNADO' },
    include: includeAtendimento,
  })

  if (!atendimento) return null

  const inst = await prisma.instituicao.findFirst()
  const fallbackInternacao = {
    dataAdmissao: fmtData(dataInternacaoReferencia(atendimento)),
    enfermariaLeito: descricaoLeitoInternacao(atendimento.leito),
  }

  if (atendimento.laudoInternacao) {
    return laudoParaImpressao(atendimento.laudoInternacao, inst, fallbackInternacao)
  }

  const prefill = montarPrefillLaudoInternacao(
    atendimento,
    inst,
    null,
    usuario
  )

  return prefillParaImpressao(prefill, inst, null, fallbackInternacao)
}
