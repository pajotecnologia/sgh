// lib/laudo-internacao.ts — Montagem de pré-preenchimento do laudo SUS de internação

import { format } from 'date-fns'
import { descriptografar } from '@/lib/encryption'
import { obterNomeCompletoPaciente } from '@/lib/nome-paciente-exibicao'
import { exameFisicoParaTexto } from '@/lib/ficha-urgencia'
import { mesclarPrefill } from '@/lib/prefill-internamento'
import type { LaudoInternacao } from '@prisma/client'

type AtendimentoCompleto = {
  id: string
  numeroAtendimento: string
  status: string
  setor: string | null
  paciente: {
    nomeCriptografado: string
    nomeExibicao: string
    cns: string | null
    dataNascimento: Date
    sexoBiologico: string
    nomeMae: string | null
    telefoneCriptografado: string | null
    endereco: {
      logradouro: string
      numero: string
      complemento: string | null
      bairro: string
      cidade: string
      estado: string
      cep: string
    } | null
  }
  medico: { nome: string; crm: string | null } | null
  triagem: {
    queixaPrincipal: string
    sinaisVitais: {
      paSistolica: number | null
      paDiastolica: number | null
      frequenciaCardiaca: number | null
      frequenciaResp: number | null
      spo2: unknown
      temperatura: unknown
      glicemia: number | null
      escalaDor: number | null
    } | null
  } | null
  prontuario: {
    anamnese: { queixaPrincipal: string; hda: string | null; exameFisico: unknown } | null
    diagnosticos: { codigoCid: string; descricaoCid: string; principal: boolean; hipotese: string | null }[]
    encaminhamentos: {
      tipo: string
      especialidade: string
      resumoClinco: string | null
      justificativa: string | null
      cidInternacao: string | null
    }[]
    requisicoes: { indicacao: string; itens: { nomeExame: string; resultado: string | null }[] }[]
  } | null
}

type InstituicaoDados = {
  nomeInstituicao: string
  nomeMunicipio: string
  cidade: string | null
  estado: string | null
  cnes: string | null
  codigoIbgeMunicipio: string | null
} | null

export type LaudoInternacaoPrefill = {
  atendimentoId: string
  numeroAtendimento: string
  statusAtendimento: string
  laudoExistente: LaudoInternacao | null
  nomeEstabelecimentoSolicitante: string
  nomeEstabelecimentoExecutante: string
  cnesSolicitante: string
  cnesExecutante: string
  codigoIbgeMunicipio: string
  nomePaciente: string
  numeroProntuario: string
  cns: string
  dataNascimento: string
  sexoCodigo: '1' | '3'
  nomeMae: string
  telefoneDdd: string
  telefoneNumero: string
  enderecoCompleto: string
  municipioResidencia: string
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
  clinica: string
  caraterInternacao: 'URGENCIA' | 'ELETIVA'
  nomeProfissionalSolicitante: string
  registroConselho: string
  dataSolicitacao: string
}

function nomeCompletoPaciente(p: AtendimentoCompleto['paciente']): string {
  return obterNomeCompletoPaciente(p.nomeExibicao, p.nomeCriptografado)
}

function telefonePartes(telefoneCriptografado: string | null): { ddd: string; numero: string } {
  if (!telefoneCriptografado) return { ddd: '', numero: '' }
  try {
    const t = descriptografar(telefoneCriptografado).replace(/\D/g, '')
    if (t.length >= 10) {
      return { ddd: t.slice(0, 2), numero: t.slice(2) }
    }
    return { ddd: '', numero: t }
  } catch {
    return { ddd: '', numero: '' }
  }
}

function sexoParaCodigoSus(sexo: string): '1' | '3' {
  return sexo === 'FEMININO' ? '3' : '1'
}

function montarSinaisVitaisTexto(sv: NonNullable<AtendimentoCompleto['triagem']>['sinaisVitais']): string {
  if (!sv) return ''
  const partes: string[] = []
  if (sv.paSistolica != null && sv.paDiastolica != null) {
    partes.push(`PA ${sv.paSistolica}/${sv.paDiastolica} mmHg`)
  }
  if (sv.frequenciaCardiaca != null) partes.push(`FC ${sv.frequenciaCardiaca} bpm`)
  if (sv.frequenciaResp != null) partes.push(`FR ${sv.frequenciaResp} irpm`)
  if (sv.spo2 != null) partes.push(`SpO2 ${sv.spo2}%`)
  if (sv.temperatura != null) partes.push(`Temp ${sv.temperatura}°C`)
  if (sv.glicemia != null) partes.push(`Glicemia ${sv.glicemia} mg/dL`)
  if (sv.escalaDor != null) partes.push(`Dor ${sv.escalaDor}/10`)
  return partes.join(' | ')
}

function montarResultadosExames(
  requisicoes: NonNullable<AtendimentoCompleto['prontuario']>['requisicoes']
): string {
  const linhas: string[] = []
  for (const req of requisicoes) {
    for (const item of req.itens) {
      if (item.resultado?.trim()) {
        linhas.push(`${item.nomeExame}: ${item.resultado.trim()}`)
      }
    }
  }
  return linhas.join('\n')
}

export function montarPrefillLaudoInternacao(
  atendimento: AtendimentoCompleto,
  instituicao: InstituicaoDados,
  laudoExistente: LaudoInternacao | null,
  usuarioSessao: { nome: string; crm?: string | null }
): LaudoInternacaoPrefill {
  const base = montarPrefillLaudoInternacaoNovo(atendimento, instituicao, usuarioSessao)
  if (laudoExistente) {
    const salvo = laudoExistenteParaPrefill(atendimento, laudoExistente)
    return {
      ...mesclarPrefill(base, salvo),
      laudoExistente,
    }
  }
  return base
}

function montarPrefillLaudoInternacaoNovo(
  atendimento: AtendimentoCompleto,
  instituicao: InstituicaoDados,
  usuarioSessao: { nome: string; crm?: string | null }
): LaudoInternacaoPrefill {
  const p = atendimento.paciente
  const pront = atendimento.prontuario
  const encInternacao = pront?.encaminhamentos.find((e) => e.tipo === 'INTERNACAO')
  const diagPrincipal = pront?.diagnosticos.find((d) => d.principal) ?? pront?.diagnosticos[0]
  const diagSecundarios = (pront?.diagnosticos ?? []).filter((d) => !d.principal)

  const tel = telefonePartes(p.telefoneCriptografado)
  const end = p.endereco
  const enderecoCompleto = end
    ? `${end.logradouro}, ${end.numero}${end.complemento ? ` - ${end.complemento}` : ''} - ${end.bairro}`
    : ''

  const queixa =
    pront?.anamnese?.queixaPrincipal ??
    atendimento.triagem?.queixaPrincipal ??
    ''
  const hda = pront?.anamnese?.hda?.trim() ?? ''
  const exameFisico = exameFisicoParaTexto(pront?.anamnese?.exameFisico)
  const svTexto = atendimento.triagem?.sinaisVitais
    ? montarSinaisVitaisTexto(atendimento.triagem.sinaisVitais)
    : ''

  const sinaisPartes = [queixa, hda, svTexto, exameFisico].filter(Boolean)
  const sinaisSintomas = sinaisPartes.join('\n\n')

  const condicoesPartes = [
    encInternacao?.justificativa,
    encInternacao?.resumoClinco,
    diagPrincipal?.hipotese,
  ].filter(Boolean) as string[]
  const condicoesJustificativa = condicoesPartes.join('\n\n')

  const nomeInst = instituicao?.nomeInstituicao ?? ''
  const cnesInst = instituicao?.cnes ?? ''
  const ibgeInst = instituicao?.codigoIbgeMunicipio ?? ''

  return {
    atendimentoId: atendimento.id,
    numeroAtendimento: atendimento.numeroAtendimento,
    statusAtendimento: atendimento.status,
    laudoExistente: null,
    nomeEstabelecimentoSolicitante: nomeInst,
    nomeEstabelecimentoExecutante: nomeInst,
    cnesSolicitante: cnesInst,
    cnesExecutante: cnesInst,
    codigoIbgeMunicipio: ibgeInst,
    nomePaciente: nomeCompletoPaciente(p),
    numeroProntuario: atendimento.numeroAtendimento,
    cns: p.cns ?? '',
    dataNascimento: format(new Date(p.dataNascimento), 'yyyy-MM-dd'),
    sexoCodigo: sexoParaCodigoSus(p.sexoBiologico),
    nomeMae: p.nomeMae ?? '',
    telefoneDdd: tel.ddd,
    telefoneNumero: tel.numero,
    enderecoCompleto,
    municipioResidencia: end?.cidade ?? instituicao?.cidade ?? instituicao?.nomeMunicipio ?? '',
    uf: end?.estado ?? instituicao?.estado ?? '',
    cep: end?.cep?.replace(/\D/g, '') ?? '',
    sinaisSintomas,
    condicoesJustificativa,
    resultadosDiagnosticos: montarResultadosExames(pront?.requisicoes ?? []),
    diagnosticoInicial: diagPrincipal
      ? `${diagPrincipal.codigoCid} — ${diagPrincipal.descricaoCid}`
      : '',
    cidPrincipal: encInternacao?.cidInternacao ?? diagPrincipal?.codigoCid ?? '',
    cidSecundario: diagSecundarios[0]?.codigoCid ?? '',
    cidAssociadas: diagSecundarios
      .slice(1)
      .map((d) => d.codigoCid)
      .join(', '),
    descricaoProcedimento: encInternacao
      ? `Internação — ${encInternacao.especialidade}`
      : 'Internação hospitalar',
    clinica: encInternacao?.especialidade ?? atendimento.setor ?? '',
    caraterInternacao: 'URGENCIA',
    nomeProfissionalSolicitante: atendimento.medico?.nome ?? usuarioSessao.nome,
    registroConselho: atendimento.medico?.crm ?? usuarioSessao.crm ?? '',
    dataSolicitacao: format(new Date(), 'yyyy-MM-dd'),
  }
}

function laudoExistenteParaPrefill(
  atendimento: AtendimentoCompleto,
  laudo: LaudoInternacao
): LaudoInternacaoPrefill {
  return {
    atendimentoId: atendimento.id,
    numeroAtendimento: atendimento.numeroAtendimento,
    statusAtendimento: atendimento.status,
    laudoExistente: laudo,
    nomeEstabelecimentoSolicitante: laudo.nomeEstabelecimentoSolicitante ?? '',
    nomeEstabelecimentoExecutante: laudo.nomeEstabelecimentoExecutante ?? '',
    cnesSolicitante: laudo.cnesSolicitante ?? '',
    cnesExecutante: laudo.cnesExecutante ?? '',
    codigoIbgeMunicipio: laudo.codigoIbgeMunicipio ?? '',
    nomePaciente: laudo.nomePaciente ?? nomeCompletoPaciente(atendimento.paciente),
    numeroProntuario: laudo.numeroProntuario ?? atendimento.numeroAtendimento,
    cns: laudo.cns ?? '',
    dataNascimento: laudo.dataNascimento
      ? format(new Date(laudo.dataNascimento), 'yyyy-MM-dd')
      : format(new Date(atendimento.paciente.dataNascimento), 'yyyy-MM-dd'),
    sexoCodigo: (laudo.sexoCodigo === '3' ? '3' : '1') as '1' | '3',
    nomeMae: laudo.nomeMae ?? '',
    telefoneDdd: laudo.telefoneDdd ?? '',
    telefoneNumero: laudo.telefoneNumero ?? '',
    enderecoCompleto: laudo.enderecoCompleto ?? '',
    municipioResidencia: laudo.municipioResidencia ?? '',
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
    clinica: laudo.clinica ?? '',
    caraterInternacao: (laudo.caraterInternacao === 'ELETIVA' ? 'ELETIVA' : 'URGENCIA') as
      | 'URGENCIA'
      | 'ELETIVA',
    nomeProfissionalSolicitante: laudo.nomeProfissionalSolicitante ?? '',
    registroConselho: laudo.registroConselho ?? '',
    dataSolicitacao: laudo.dataSolicitacao
      ? format(new Date(laudo.dataSolicitacao), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
  }
}

export function dadosLaudoParaPrisma(
  dados: import('@/lib/validations/internamento').LaudoInternacaoForm,
  preenchidoPorId: string
) {
  const parseData = (s: string) => {
    const d = new Date(s.includes('T') ? s : `${s}T12:00:00`)
    return Number.isNaN(d.getTime()) ? null : d
  }

  return {
    status: dados.status,
    nomeEstabelecimentoSolicitante: dados.nomeEstabelecimentoSolicitante?.trim() || null,
    cnesSolicitante: dados.cnesSolicitante?.trim() || null,
    nomeEstabelecimentoExecutante: dados.nomeEstabelecimentoExecutante?.trim() || null,
    cnesExecutante: dados.cnesExecutante?.trim() || null,
    nomePaciente: dados.nomePaciente.trim(),
    numeroProntuario: dados.numeroProntuario?.trim() || null,
    cns: dados.cns?.trim() || null,
    dataNascimento: parseData(dados.dataNascimento),
    sexoCodigo: dados.sexoCodigo,
    nomeMae: dados.nomeMae?.trim() || null,
    telefoneDdd: dados.telefoneDdd?.trim() || null,
    telefoneNumero: dados.telefoneNumero?.trim() || null,
    enderecoCompleto: dados.enderecoCompleto?.trim() || null,
    municipioResidencia: dados.municipioResidencia?.trim() || null,
    codigoIbgeMunicipio: dados.codigoIbgeMunicipio?.trim() || null,
    uf: dados.uf?.trim().toUpperCase().slice(0, 2) || null,
    cep: dados.cep?.replace(/\D/g, '') || null,
    sinaisSintomas: dados.sinaisSintomas.trim(),
    condicoesJustificativa: dados.condicoesJustificativa.trim(),
    resultadosDiagnosticos: dados.resultadosDiagnosticos?.trim() || null,
    diagnosticoInicial: dados.diagnosticoInicial?.trim() || null,
    cidPrincipal: dados.cidPrincipal.trim(),
    cidSecundario: dados.cidSecundario?.trim() || null,
    cidAssociadas: dados.cidAssociadas?.trim() || null,
    descricaoProcedimento: dados.descricaoProcedimento.trim(),
    codigoProcedimento: dados.codigoProcedimento?.trim() || null,
    clinica: dados.clinica?.trim() || null,
    caraterInternacao: dados.caraterInternacao,
    documentoProfissionalTipo: dados.documentoProfissionalTipo ?? null,
    documentoProfissionalNumero: dados.documentoProfissionalNumero?.trim() || null,
    nomeProfissionalSolicitante: dados.nomeProfissionalSolicitante.trim(),
    dataSolicitacao: parseData(dados.dataSolicitacao),
    registroConselho: dados.registroConselho?.trim() || null,
    causasExternas: dados.causasExternas ?? undefined,
    autorizacao: dados.autorizacao ?? undefined,
    preenchidoPorId,
  }
}
