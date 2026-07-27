// lib/multidisciplinar-internacao.ts

import { format } from 'date-fns'
import type { FichaMultidisciplinarForm } from '@/lib/validations/multidisciplinar'
import type { FichaMultidisciplinar as FichaMultidisciplinarModel } from '@prisma/client'
import {
  type AtendimentoInternacaoCtx,
  identificacaoPacienteInternacao,
  mesclarPrefill,
  mesclarSecaoJson,
  montarMedicamentosInternacao,
  montarResumoClinicoInternacao,
  montarSinaisVitaisTextoInternacao,
  montarTextoAlergias,
  montarEstadoGeralInternacao,
} from '@/lib/prefill-internamento'

type AtendimentoMulti = AtendimentoInternacaoCtx

export type FichaMultidisciplinarPrefill = FichaMultidisciplinarForm & {
  atendimentoId: string
  numeroAtendimento: string
  diasInternacao: number | null
}

function secaoVaziaMedico(medico: AtendimentoMulti['medico'], usuario: { nome: string; crm?: string | null }) {
  return {
    resumoClinico: '',
    conduta: '',
    prognostico: '',
    observacoes: '',
    nomeProfissional: medico?.nome ?? usuario.nome,
    conselho: medico?.crm ?? usuario.crm ?? '',
    dataAvaliacao: format(new Date(), 'yyyy-MM-dd'),
  }
}

function parseJsonSecao<T>(json: unknown, defaults: T): T {
  if (!json || typeof json !== 'object') return defaults
  return { ...defaults, ...(json as Record<string, unknown>) } as T
}

function fichaParaForm(ficha: FichaMultidisciplinarModel): FichaMultidisciplinarForm {
  const med = parseJsonSecao(ficha.medico, secaoVaziaMedico(null, { nome: '' }))
  return {
    status: ficha.status as FichaMultidisciplinarForm['status'],
    nomePaciente: ficha.nomePaciente ?? '',
    numeroProntuario: ficha.numeroProntuario ?? '',
    dataNascimento: ficha.dataNascimento
      ? format(new Date(ficha.dataNascimento), 'yyyy-MM-dd')
      : '',
    sexo: (ficha.sexo as FichaMultidisciplinarForm['sexo']) ?? 'NAO_INFORMADO',
    setorUnidade: ficha.setorUnidade ?? '',
    leitoDescricao: ficha.leitoDescricao ?? '',
    dataInternacao: ficha.dataInternacao
      ? format(new Date(ficha.dataInternacao), 'yyyy-MM-dd')
      : '',
    diagnosticoPrincipal: ficha.diagnosticoPrincipal ?? '',
    cidPrincipal: ficha.cidPrincipal ?? '',
    medico: parseJsonSecao(ficha.medico, med) as FichaMultidisciplinarForm['medico'],
    enfermagem: parseJsonSecao(ficha.enfermagem, {
      diagnosticoEnfermagem: '',
      intervencoes: '',
      integridadePele: '',
      mobilidade: '',
      eliminacoes: '',
      escalaBraden: '',
      observacoes: '',
      nomeProfissional: '',
      conselho: '',
      dataAvaliacao: '',
    }) as FichaMultidisciplinarForm['enfermagem'],
    nutricao: parseJsonSecao(ficha.nutricao, {
      riscoNutricional: '',
      dietaAtual: '',
      restricoes: '',
      condutaMetas: '',
      observacoes: '',
      nomeProfissional: '',
      conselho: '',
      dataAvaliacao: '',
    }) as FichaMultidisciplinarForm['nutricao'],
    fisioterapia: parseJsonSecao(ficha.fisioterapia, {
      avaliacaoFuncional: '',
      condutaMetas: '',
      observacoes: '',
      nomeProfissional: '',
      conselho: '',
      dataAvaliacao: '',
    }) as FichaMultidisciplinarForm['fisioterapia'],
    psicologia: parseJsonSecao(ficha.psicologia, {
      aspectosPsicossociais: '',
      redeApoio: '',
      condutaOrientacoes: '',
      observacoes: '',
      nomeProfissional: '',
      conselho: '',
      dataAvaliacao: '',
    }) as FichaMultidisciplinarForm['psicologia'],
    farmacia: parseJsonSecao(ficha.farmacia, {
      reconciliacaoMedicamentosa: '',
      interacoesAlertas: '',
      orientacoes: '',
      observacoes: '',
      nomeProfissional: '',
      conselho: '',
      dataAvaliacao: '',
    }) as FichaMultidisciplinarForm['farmacia'],
    planoConjunto: parseJsonSecao(ficha.planoConjunto, {
      dataReuniao: '',
      metasEquipe: '',
      encaminhamentos: '',
      dataProximaRevisao: '',
      observacoesGerais: '',
    }) as FichaMultidisciplinarForm['planoConjunto'],
  }
}

export function montarPrefillFichaMultidisciplinar(
  atendimento: AtendimentoMulti,
  fichaExistente: FichaMultidisciplinarModel | null,
  usuarioSessao: { nome: string; crm?: string | null; role: string }
): FichaMultidisciplinarPrefill {
  const id = identificacaoPacienteInternacao(atendimento)
  const hoje = format(new Date(), 'yyyy-MM-dd')
  const svTexto = montarSinaisVitaisTextoInternacao(atendimento.triagem?.sinaisVitais ?? null)
  const alergias = montarTextoAlergias(atendimento.paciente)
  const medicamentos = montarMedicamentosInternacao(atendimento)

  const medicoBase = {
    ...secaoVaziaMedico(atendimento.medico, usuarioSessao),
    resumoClinico: montarResumoClinicoInternacao(atendimento),
  }
  const enfermagemBase = {
    diagnosticoEnfermagem: '',
    intervencoes: '',
    integridadePele: '',
    mobilidade: '',
    eliminacoes: '',
    escalaBraden: '',
    observacoes: [
      atendimento.triagem?.queixaPrincipal ? `Queixa: ${atendimento.triagem.queixaPrincipal}` : '',
      svTexto ? `Sinais vitais (triagem): ${svTexto}` : '',
      alergias ? `Alergias: ${alergias}` : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
    nomeProfissional:
      usuarioSessao.role === 'ENFERMEIRO' || usuarioSessao.role === 'TECNICO_ENFERMAGEM'
        ? usuarioSessao.nome
        : '',
    conselho: '',
    dataAvaliacao: hoje,
  }
  const nutricaoBase = {
    riscoNutricional: '',
    dietaAtual: '',
    restricoes: alergias,
    condutaMetas: '',
    observacoes: '',
    nomeProfissional: '',
    conselho: '',
    dataAvaliacao: hoje,
  }
  const fisioterapiaBase = {
    avaliacaoFuncional: montarEstadoGeralInternacao(atendimento),
    condutaMetas: '',
    observacoes: '',
    nomeProfissional: '',
    conselho: '',
    dataAvaliacao: hoje,
  }
  const psicologiaBase = {
    aspectosPsicossociais: '',
    redeApoio: '',
    condutaOrientacoes: '',
    observacoes: '',
    nomeProfissional: '',
    conselho: '',
    dataAvaliacao: hoje,
  }
  const farmaciaBase = {
    reconciliacaoMedicamentosa: medicamentos,
    interacoesAlertas: alergias ? `Alergias registradas: ${alergias}` : '',
    orientacoes: '',
    observacoes: '',
    nomeProfissional: '',
    conselho: '',
    dataAvaliacao: hoje,
  }
  const planoBase = {
    dataReuniao: '',
    metasEquipe: '',
    encaminhamentos: '',
    dataProximaRevisao: '',
    observacoesGerais: '',
  }

  const base: FichaMultidisciplinarPrefill = {
    atendimentoId: id.atendimentoId,
    numeroAtendimento: id.numeroAtendimento,
    diasInternacao: id.diasInternacao,
    status: 'RASCUNHO',
    nomePaciente: id.nomePaciente,
    numeroProntuario: id.numeroProntuario,
    dataNascimento: id.dataNascimento,
    sexo: id.sexo as FichaMultidisciplinarForm['sexo'],
    setorUnidade: id.setorUnidade,
    leitoDescricao: id.leitoDescricao,
    dataInternacao: id.dataInternacao,
    diagnosticoPrincipal: id.diagnosticoPrincipal,
    cidPrincipal: id.cidPrincipal,
    medico: medicoBase,
    enfermagem: enfermagemBase,
    nutricao: nutricaoBase,
    fisioterapia: fisioterapiaBase,
    psicologia: psicologiaBase,
    farmacia: farmaciaBase,
    planoConjunto: planoBase,
  }

  if (!fichaExistente) return base

  const salvo = fichaParaForm(fichaExistente)
  const merged = mesclarPrefill(base, {
    ...salvo,
    atendimentoId: id.atendimentoId,
    numeroAtendimento: id.numeroAtendimento,
    diasInternacao: id.diasInternacao,
  }) as FichaMultidisciplinarPrefill

  merged.medico = mesclarSecaoJson(medicoBase, salvo.medico ?? undefined)
  merged.enfermagem = mesclarSecaoJson(enfermagemBase, salvo.enfermagem ?? undefined)
  merged.nutricao = mesclarSecaoJson(nutricaoBase, salvo.nutricao ?? undefined)
  merged.fisioterapia = mesclarSecaoJson(fisioterapiaBase, salvo.fisioterapia ?? undefined)
  merged.psicologia = mesclarSecaoJson(psicologiaBase, salvo.psicologia ?? undefined)
  merged.farmacia = mesclarSecaoJson(farmaciaBase, salvo.farmacia ?? undefined)
  merged.planoConjunto = mesclarSecaoJson(planoBase, salvo.planoConjunto ?? undefined)

  return merged
}

export function dadosFichaMultidisciplinarParaPrisma(
  dados: FichaMultidisciplinarForm,
  preenchidoPorId: string
) {
  const parseData = (s: string | undefined) => {
    if (!s?.trim()) return null
    const d = new Date(s.includes('T') ? s : `${s}T12:00:00`)
    return Number.isNaN(d.getTime()) ? null : d
  }

  return {
    status: dados.status,
    nomePaciente: dados.nomePaciente.trim(),
    numeroProntuario: dados.numeroProntuario?.trim() || null,
    dataNascimento: parseData(dados.dataNascimento),
    sexo: dados.sexo,
    setorUnidade: dados.setorUnidade?.trim() || null,
    leitoDescricao: dados.leitoDescricao?.trim() || null,
    dataInternacao: parseData(dados.dataInternacao),
    diagnosticoPrincipal: dados.diagnosticoPrincipal?.trim() || null,
    cidPrincipal: dados.cidPrincipal?.trim() || null,
    medico: dados.medico ?? {},
    enfermagem: dados.enfermagem ?? {},
    nutricao: dados.nutricao ?? {},
    fisioterapia: dados.fisioterapia ?? {},
    psicologia: dados.psicologia ?? {},
    farmacia: dados.farmacia ?? {},
    planoConjunto: dados.planoConjunto ?? {},
    preenchidoPorId,
  }
}

export const LABEL_STATUS_FICHA_MULTIDISCIPLINAR: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
}
