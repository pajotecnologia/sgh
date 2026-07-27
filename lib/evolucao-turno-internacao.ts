// lib/evolucao-turno-internacao.ts

import { format, startOfDay } from 'date-fns'
import { exameFisicoParaTexto } from '@/lib/ficha-urgencia'
import type { FichaEvolucaoTurnoForm } from '@/lib/validations/evolucao-turno'
import type { FichaEvolucaoTurno as FichaEvolucaoTurnoModel } from '@prisma/client'
import {
  type AtendimentoInternacaoCtx,
  identificacaoPacienteInternacao,
  mesclarPrefill,
  mesclarSecaoJson,
  montarMedicamentosInternacao,
  montarResumoClinicoInternacao,
  montarEstadoGeralInternacao,
  montarTextoAlergias,
  sinaisVitaisFormInternacao,
  funcaoProfissionalDefault,
} from '@/lib/prefill-internamento'

type AtendimentoEvol = AtendimentoInternacaoCtx

export const LABEL_TURNO: Record<string, string> = {
  DIURNA: 'Diurna (07h às 19h)',
  NOTURNA: 'Noturna (19h às 07h)',
}

export const LABEL_STATUS_EVOLUCAO_TURNO: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  REGISTRADA: 'Registrada',
}

function fichaParaForm(ficha: FichaEvolucaoTurnoModel): FichaEvolucaoTurnoForm {
  const sv = (ficha.sinaisVitais ?? {}) as Record<string, unknown>
  const av = (ficha.avaliacaoSistemas ?? {}) as Record<string, string>
  return {
    id: ficha.id,
    turno: ficha.turno as 'DIURNA' | 'NOTURNA',
    dataReferencia: format(new Date(ficha.dataReferencia), 'yyyy-MM-dd'),
    status: ficha.status as 'RASCUNHO' | 'REGISTRADA',
    nomePaciente: ficha.nomePaciente ?? '',
    numeroProntuario: ficha.numeroProntuario ?? '',
    setorUnidade: ficha.setorUnidade ?? '',
    leitoDescricao: ficha.leitoDescricao ?? '',
    estadoGeral: ficha.estadoGeral ?? '',
    evolucaoClinica: ficha.evolucaoClinica ?? '',
    exameFisico: ficha.exameFisico ?? '',
    sinaisVitais: {
      paSistolica: String(sv.paSistolica ?? ''),
      paDiastolica: String(sv.paDiastolica ?? ''),
      frequenciaCardiaca: String(sv.frequenciaCardiaca ?? ''),
      frequenciaResp: String(sv.frequenciaResp ?? ''),
      spo2: String(sv.spo2 ?? ''),
      temperatura: String(sv.temperatura ?? ''),
      glicemia: String(sv.glicemia ?? ''),
    },
    avaliacaoSistemas: av,
    dietaEliminacoes: ficha.dietaEliminacoes ?? '',
    medicamentosProcedimentos: ficha.medicamentosProcedimentos ?? '',
    intercorrencias: ficha.intercorrencias ?? '',
    condutaProximoTurno: ficha.condutaProximoTurno ?? '',
    nomeProfissional: ficha.nomeProfissional ?? '',
    conselhoProfissional: ficha.conselhoProfissional ?? '',
    funcaoProfissional: (ficha.funcaoProfissional as FichaEvolucaoTurnoForm['funcaoProfissional']) ?? null,
  }
}

export function inferirTurnoAtual(): 'DIURNA' | 'NOTURNA' {
  const hora = new Date().getHours()
  return hora >= 7 && hora < 19 ? 'DIURNA' : 'NOTURNA'
}

function montarBasePrefillEvolucaoTurno(
  atendimento: AtendimentoEvol,
  turno: 'DIURNA' | 'NOTURNA',
  dataReferencia: string,
  usuario: { nome: string; crm?: string | null; role: string }
): FichaEvolucaoTurnoForm {
  const id = identificacaoPacienteInternacao(atendimento)
  const alergias = montarTextoAlergias(atendimento.paciente)
  const exameFisico = exameFisicoParaTexto(atendimento.prontuario?.anamnese?.exameFisico)
  const funcaoDefault = funcaoProfissionalDefault(usuario.role) as FichaEvolucaoTurnoForm['funcaoProfissional']

  return {
    turno,
    dataReferencia,
    status: 'RASCUNHO',
    nomePaciente: id.nomePaciente,
    numeroProntuario: id.numeroProntuario,
    setorUnidade: id.setorUnidade,
    leitoDescricao: id.leitoDescricao,
    estadoGeral: montarEstadoGeralInternacao(atendimento),
    evolucaoClinica: '',
    exameFisico,
    sinaisVitais: sinaisVitaisFormInternacao(atendimento.triagem?.sinaisVitais ?? null),
    avaliacaoSistemas: {},
    dietaEliminacoes: '',
    medicamentosProcedimentos: montarMedicamentosInternacao(atendimento),
    intercorrencias: alergias ? `Alergias registradas: ${alergias}` : '',
    condutaProximoTurno: '',
    nomeProfissional: atendimento.medico?.nome ?? usuario.nome,
    conselhoProfissional: atendimento.medico?.crm ?? usuario.crm ?? '',
    funcaoProfissional:
      funcaoDefault === 'ENFERMEIRO' && usuario.role === 'TECNICO_ENFERMAGEM'
        ? 'TECNICO_ENFERMAGEM'
        : funcaoDefault,
  }
}

export function montarPrefillFichaEvolucaoTurno(
  atendimento: AtendimentoEvol,
  turno: 'DIURNA' | 'NOTURNA',
  dataReferencia: string,
  fichaExistente: FichaEvolucaoTurnoModel | null,
  usuario: { nome: string; crm?: string | null; role: string }
): FichaEvolucaoTurnoForm {
  const base = montarBasePrefillEvolucaoTurno(atendimento, turno, dataReferencia, usuario)
  if (!fichaExistente) return base

  const salvo = fichaParaForm(fichaExistente)
  const merged = mesclarPrefill(base, salvo)
  merged.sinaisVitais = mesclarSecaoJson(
    base.sinaisVitais ?? {},
    salvo.sinaisVitais ?? undefined
  ) as FichaEvolucaoTurnoForm['sinaisVitais']
  merged.avaliacaoSistemas = salvo.avaliacaoSistemas ?? {}
  merged.turno = salvo.turno
  merged.dataReferencia = salvo.dataReferencia
  if (salvo.id) merged.id = salvo.id

  return merged
}

export function dadosFichaEvolucaoTurnoParaPrisma(
  dados: FichaEvolucaoTurnoForm,
  preenchidoPorId: string,
  registrar: boolean
) {
  const parseData = (s: string) => {
    const d = new Date(s.includes('T') ? s : `${s}T12:00:00`)
    return Number.isNaN(d.getTime()) ? startOfDay(new Date()) : startOfDay(d)
  }

  return {
    turno: dados.turno,
    dataReferencia: parseData(dados.dataReferencia),
    status: dados.status,
    nomePaciente: dados.nomePaciente.trim(),
    numeroProntuario: dados.numeroProntuario?.trim() || null,
    setorUnidade: dados.setorUnidade?.trim() || null,
    leitoDescricao: dados.leitoDescricao?.trim() || null,
    estadoGeral: dados.estadoGeral?.trim() || null,
    evolucaoClinica: dados.evolucaoClinica?.trim() || null,
    exameFisico: dados.exameFisico?.trim() || null,
    sinaisVitais: dados.sinaisVitais ?? {},
    avaliacaoSistemas: dados.avaliacaoSistemas ?? {},
    dietaEliminacoes: dados.dietaEliminacoes?.trim() || null,
    medicamentosProcedimentos: dados.medicamentosProcedimentos?.trim() || null,
    intercorrencias: dados.intercorrencias?.trim() || null,
    condutaProximoTurno: dados.condutaProximoTurno?.trim() || null,
    nomeProfissional: dados.nomeProfissional.trim(),
    conselhoProfissional: dados.conselhoProfissional?.trim() || null,
    funcaoProfissional: dados.funcaoProfissional ?? null,
    preenchidoPorId,
    registradoEm: registrar ? new Date() : null,
  }
}
