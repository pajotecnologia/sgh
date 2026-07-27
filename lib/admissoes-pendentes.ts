// lib/admissoes-pendentes.ts — Pacientes aguardando recepção pela enfermagem

import { prisma } from '@/lib/prisma'
import { obterNomeCompletoPaciente } from '@/lib/nome-paciente-exibicao'
import { descricaoLeitoInternacao } from '@/lib/prefill-internamento'
import {
  fichaHospitalarPreenchida,
  fichaSusPreenchida,
  internacaoDocumentacaoCompleta,
} from '@/lib/internacao-completude'
import type { CorTriagem } from '@/types'

export type AdmissaoPendenteItem = {
  atendimentoId: string
  numeroAtendimento: string
  nomePaciente: string
  solicitadoEm: string
  tipoClinica: string
  cidInternacao: string
  prioridade: string
  medicoNome: string
  corTriagem: CorTriagem | null
  encaminhamentoId: string
}

export async function listarAdmissoesPendentes(): Promise<AdmissaoPendenteItem[]> {
  const atendimentos = await prisma.atendimento.findMany({
    where: {
      deletedAt: null,
      status: 'AGUARDANDO_INTERNACAO',
    },
    include: {
      paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
      medico: { select: { nome: true } },
      triagem: { select: { corClassificacao: true } },
      prontuario: {
        select: {
          encaminhamentos: {
            where: { tipo: 'INTERNACAO' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  })

  return atendimentos.map((a) => {
    const enc = a.prontuario?.encaminhamentos?.[0]

    return {
      atendimentoId: a.id,
      numeroAtendimento: a.numeroAtendimento,
      nomePaciente: obterNomeCompletoPaciente(
        a.paciente.nomeExibicao,
        a.paciente.nomeCriptografado
      ),
      solicitadoEm: (enc?.createdAt ?? a.updatedAt ?? new Date()).toISOString(),
      tipoClinica: enc?.especialidade ?? a.setor ?? 'Clínica Geral',
      cidInternacao: enc?.cidInternacao ?? '',
      prioridade: enc?.prioridade ?? '',
      medicoNome: a.medico?.nome ?? '—',
      corTriagem: a.triagem?.corClassificacao ?? null,
      encaminhamentoId: enc?.id ?? '',
    }
  })
}

export type PacienteInternadoItem = {
  atendimentoId: string
  numeroAtendimento: string
  nomePaciente: string
  obstetrico: boolean
  internadoEm: string
  leito: string
  setor: string
  tipoClinica: string
  cidInternacao: string
  temFichaSus: boolean
  fichaSusPreenchida: boolean
  fichaHospitalarPreenchida: boolean
  internacaoCompleta: boolean
  statusFichaHospitalar: string | null
  statusLaudoSus: string | null
  corTriagem: CorTriagem | null
}

export type FichaHospitalarItem = {
  atendimentoId: string
  numeroAtendimento: string
  nomePaciente: string
  obstetrico: boolean
  statusAtendimento: string
  statusFicha: string | null
  statusLaudoSus: string | null
  fichaSusPreenchida: boolean
  fichaHospitalarPreenchida: boolean
  internacaoCompleta: boolean
  atualizadoEm: string | null
  leito: string
  corTriagem: CorTriagem | null
}

/** Pacientes já aceitos/internados pela enfermagem (recepção confirmada). */
export async function listarPacientesInternados(): Promise<PacienteInternadoItem[]> {
  const atendimentos = await prisma.atendimento.findMany({
    where: {
      deletedAt: null,
      status: 'INTERNADO',
    },
    include: {
      paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
      triagem: { select: { corClassificacao: true } },
      leito: { select: { ala: true, quarto: true, codigo: true, tipo: true } },
      laudoInternacao: { select: { status: true } },
      fichaInternacaoAlta: { select: { status: true, updatedAt: true } },
      prontuario: {
        select: {
          encaminhamentos: {
            where: { tipo: 'INTERNACAO' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { especialidade: true, cidInternacao: true, createdAt: true },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  })

  return atendimentos.map((a) => {
    const enc = a.prontuario?.encaminhamentos?.[0]
    return {
      atendimentoId: a.id,
      numeroAtendimento: a.numeroAtendimento,
      nomePaciente: obterNomeCompletoPaciente(
        a.paciente.nomeExibicao,
        a.paciente.nomeCriptografado
      ),
      obstetrico: a.obstetrico,
      internadoEm: (enc?.createdAt ?? a.updatedAt).toISOString(),
      leito: descricaoLeitoInternacao(a.leito),
      setor: a.setor ?? '',
      tipoClinica: enc?.especialidade ?? '',
      cidInternacao: enc?.cidInternacao ?? '',
      temFichaSus: Boolean(a.laudoInternacao?.status),
      fichaSusPreenchida: fichaSusPreenchida(a.laudoInternacao?.status),
      fichaHospitalarPreenchida: fichaHospitalarPreenchida(a.fichaInternacaoAlta?.status),
      internacaoCompleta: internacaoDocumentacaoCompleta(
        a.laudoInternacao?.status,
        a.fichaInternacaoAlta?.status
      ),
      statusFichaHospitalar: a.fichaInternacaoAlta?.status ?? null,
      statusLaudoSus: a.laudoInternacao?.status ?? null,
      corTriagem: a.triagem?.corClassificacao ?? null,
    }
  })
}

/** Pacientes em internação ou aguardando recepção — para aba Ficha Hospitalar. */
export async function listarFichasHospitalares(): Promise<FichaHospitalarItem[]> {
  const atendimentos = await prisma.atendimento.findMany({
    where: {
      deletedAt: null,
      status: { in: ['AGUARDANDO_INTERNACAO', 'INTERNADO'] },
    },
    include: {
      paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
      triagem: { select: { corClassificacao: true } },
      leito: { select: { ala: true, quarto: true, codigo: true, tipo: true } },
      laudoInternacao: { select: { status: true } },
      fichaInternacaoAlta: { select: { status: true, updatedAt: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 300,
  })

  return atendimentos.map((a) => ({
    atendimentoId: a.id,
    numeroAtendimento: a.numeroAtendimento,
    nomePaciente: obterNomeCompletoPaciente(
      a.paciente.nomeExibicao,
      a.paciente.nomeCriptografado
    ),
    obstetrico: a.obstetrico,
    statusAtendimento: a.status,
    statusFicha: a.fichaInternacaoAlta?.status ?? null,
    statusLaudoSus: a.laudoInternacao?.status ?? null,
    fichaSusPreenchida: fichaSusPreenchida(a.laudoInternacao?.status),
    fichaHospitalarPreenchida: fichaHospitalarPreenchida(a.fichaInternacaoAlta?.status),
    internacaoCompleta: internacaoDocumentacaoCompleta(
      a.laudoInternacao?.status,
      a.fichaInternacaoAlta?.status
    ),
    atualizadoEm: a.fichaInternacaoAlta?.updatedAt?.toISOString() ?? null,
    leito: descricaoLeitoInternacao(a.leito),
    corTriagem: a.triagem?.corClassificacao ?? null,
  }))
}
