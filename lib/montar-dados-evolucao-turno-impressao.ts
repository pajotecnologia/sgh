// lib/montar-dados-evolucao-turno-impressao.ts

import { format } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { LABEL_STATUS_EVOLUCAO_TURNO, LABEL_TURNO } from '@/lib/evolucao-turno-internacao'
import { SISTEMAS_AVALIACAO, type AvaliacaoSistemas } from '@/lib/evolucao-turno-avaliacao'

function avaliacaoSistemasLinhas(av: AvaliacaoSistemas | null): { titulo: string; texto: string }[] {
  if (!av) return []
  const linhas: { titulo: string; texto: string }[] = []
  for (const sistema of SISTEMAS_AVALIACAO) {
    const partes: string[] = []
    for (const grupo of sistema.grupos) {
      const sel = av[grupo.key]
      if (!sel) continue
      const opcao = grupo.opcoes.find((op) => op.value === sel)
      if (!opcao) continue
      let txt = opcao.label
      if (opcao.textoKey && av[opcao.textoKey]?.trim()) txt += ` ${av[opcao.textoKey].trim()}`
      partes.push(grupo.label ? `${grupo.label}: ${txt}` : txt)
    }
    for (const campo of sistema.camposTexto ?? []) {
      if (av[campo.key]?.trim()) partes.push(`${campo.label}: ${av[campo.key].trim()}`)
    }
    if (partes.length) linhas.push({ titulo: sistema.titulo, texto: partes.join('; ') })
  }
  return linhas
}

function fmtData(d: Date | null | undefined): string {
  if (!d) return ''
  return format(new Date(d), 'dd/MM/yyyy')
}

function labelFuncao(v: string | null | undefined): string {
  if (v === 'MEDICO') return 'Médico(a)'
  if (v === 'ENFERMEIRO') return 'Enfermeiro(a)'
  if (v === 'TECNICO_ENFERMAGEM') return 'Téc. enfermagem'
  if (v === 'OUTRO') return 'Outro'
  return '—'
}

function sinaisVitaisTexto(sv: Record<string, unknown> | null): string {
  if (!sv) return '—'
  const partes: string[] = []
  if (sv.paSistolica || sv.paDiastolica) {
    partes.push(`PA ${sv.paSistolica ?? '—'}/${sv.paDiastolica ?? '—'} mmHg`)
  }
  if (sv.frequenciaCardiaca) partes.push(`FC ${sv.frequenciaCardiaca} bpm`)
  if (sv.frequenciaResp) partes.push(`FR ${sv.frequenciaResp} irpm`)
  if (sv.spo2) partes.push(`SpO2 ${sv.spo2}%`)
  if (sv.temperatura) partes.push(`Temp ${sv.temperatura} °C`)
  if (sv.glicemia) partes.push(`Glicemia ${sv.glicemia} mg/dL`)
  return partes.length ? partes.join(' | ') : '—'
}

export type FichaEvolucaoTurnoImpressaoDados = {
  instituicao: {
    nomeMunicipio: string
    nomeInstituicao: string
    logomarcaUrl: string | null
  }
  turno: string
  dataReferencia: string
  status: string
  numeroAtendimento: string
  nomePaciente: string
  numeroProntuario: string
  setorUnidade: string
  leitoDescricao: string
  estadoGeral: string
  avaliacaoSistemas: { titulo: string; texto: string }[]
  evolucaoClinica: string
  sinaisVitais: string
  intercorrencias: string
  nomeProfissional: string
  conselhoProfissional: string
  funcaoProfissional: string
  registradoEm: string
}

export async function montarDadosEvolucaoTurnoImpressao(
  fichaId: string
): Promise<FichaEvolucaoTurnoImpressaoDados | null> {
  const ficha = await prisma.fichaEvolucaoTurno.findUnique({
    where: { id: fichaId },
    include: {
      atendimento: { select: { numeroAtendimento: true, deletedAt: true, status: true } },
    },
  })

  if (
    !ficha ||
    ficha.atendimento.deletedAt ||
    ficha.atendimento.status !== 'INTERNADO'
  ) {
    return null
  }

  const inst = await prisma.instituicao.findFirst({
    select: { nomeInstituicao: true, nomeMunicipio: true, logomarcaUrl: true },
  })

  const sv = ficha.sinaisVitais as Record<string, unknown> | null

  return {
    instituicao: {
      nomeMunicipio: inst?.nomeMunicipio ?? '',
      nomeInstituicao: inst?.nomeInstituicao ?? '',
      logomarcaUrl: inst?.logomarcaUrl ?? null,
    },
    turno: LABEL_TURNO[ficha.turno] ?? ficha.turno,
    dataReferencia: fmtData(ficha.dataReferencia),
    status: LABEL_STATUS_EVOLUCAO_TURNO[ficha.status] ?? ficha.status,
    numeroAtendimento: ficha.atendimento.numeroAtendimento,
    nomePaciente: ficha.nomePaciente ?? '',
    numeroProntuario: ficha.numeroProntuario ?? '',
    setorUnidade: ficha.setorUnidade ?? '',
    leitoDescricao: ficha.leitoDescricao ?? '',
    estadoGeral: ficha.estadoGeral ?? '',
    avaliacaoSistemas: avaliacaoSistemasLinhas(ficha.avaliacaoSistemas as AvaliacaoSistemas | null),
    evolucaoClinica: ficha.evolucaoClinica ?? '',
    sinaisVitais: sinaisVitaisTexto(sv),
    intercorrencias: ficha.intercorrencias ?? '',
    nomeProfissional: ficha.nomeProfissional ?? '',
    conselhoProfissional: ficha.conselhoProfissional ?? '',
    funcaoProfissional: labelFuncao(ficha.funcaoProfissional),
    registradoEm: ficha.registradoEm ? format(new Date(ficha.registradoEm), 'dd/MM/yyyy HH:mm') : '—',
  }
}
