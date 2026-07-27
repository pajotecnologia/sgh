// lib/prefill-internamento.ts — Contexto clínico compartilhado para abas de internação

import { format, differenceInCalendarDays } from 'date-fns'
import { obterNomeCompletoPaciente } from '@/lib/nome-paciente-exibicao'
import { exameFisicoParaTexto } from '@/lib/ficha-urgencia'
import { formatarDosePrescricao, separarDoseUnidade } from '@/lib/prescricao-ui'

/** Preenche com `padrao` quando `atual` estiver vazio */
export function preencherSeVazio(atual: string | null | undefined, padrao: string): string {
  const v = atual?.trim()
  return v ? v : padrao
}

/** Mescla objeto: valores não vazos de `salvo` prevalecem; vazios recebem `base` */
export function mesclarPrefill<T extends Record<string, unknown>>(base: T, salvo: T): T {
  const out = { ...base, ...salvo } as Record<string, unknown>
  for (const key of Object.keys(base)) {
    const valorSalvo = salvo[key]
    const valorBase = base[key]
    if (typeof valorSalvo === 'string' && typeof valorBase === 'string') {
      out[key] = preencherSeVazio(valorSalvo, valorBase)
    }
  }
  return out as T
}

export function mesclarSecaoJson<T extends Record<string, unknown>>(base: T, salvo: T | undefined | null): T {
  if (!salvo) return base
  const out = { ...base, ...salvo } as Record<string, unknown>
  for (const key of Object.keys(base)) {
    const v = out[key]
    if (typeof v === 'string' && !v.trim() && typeof base[key] === 'string') {
      out[key] = base[key]
    }
  }
  return out as T
}

export const includeAtendimentoInternacao = {
  paciente: {
    select: {
      nomeCriptografado: true,
      nomeExibicao: true,
      dataNascimento: true,
      sexoBiologico: true,
      cns: true,
      nomeMae: true,
      telefoneCriptografado: true,
      endereco: true,
      alergias: { select: { descricao: true, gravidade: true } },
      medicamentosCont: { select: { nome: true, dose: true, frequencia: true } },
    },
  },
  medico: { select: { nome: true, crm: true } },
  leito: { select: { ala: true, quarto: true, codigo: true, tipo: true } },
  triagem: {
    select: {
      queixaPrincipal: true,
      corClassificacao: true,
      sinaisVitais: true,
    },
  },
  prontuario: {
    include: {
      anamnese: true,
      diagnosticos: { orderBy: { principal: 'desc' as const } },
      encaminhamentos: { orderBy: { createdAt: 'desc' as const } },
      evolucoes: {
        orderBy: { registradoEm: 'desc' as const },
        take: 3,
        select: { conteudo: true, registradoEm: true },
      },
      prescricoes: {
        orderBy: { emitidaEm: 'desc' as const },
        take: 10,
        include: {
          itens: {
            select: {
              nomeMedicamento: true,
              dose: true,
              unidadeMedida: true,
              via: true,
              frequencia: true,
              observacoes: true,
            },
          },
        },
      },
      requisicoes: {
        include: { itens: { select: { nomeExame: true, resultado: true } } },
      },
    },
  },
} as const

type PacienteCtx = {
  nomeCriptografado?: string | null
  nomeExibicao: string
  nomeCompleto?: string | null
  dataNascimento: Date
  sexoBiologico: string
  alergias?: { descricao: string; gravidade: string | null }[]
  medicamentosCont?: { nome: string; dose: string | null; frequencia: string | null }[]
}

type AtendimentoCtx = {
  id: string
  numeroAtendimento: string
  setor: string | null
  updatedAt: Date
  paciente: PacienteCtx
  medico: { nome: string; crm: string | null } | null
  leito: { ala: string; quarto: string | null; codigo: string; tipo: string } | null
  triagem: {
    queixaPrincipal: string
    corClassificacao?: string
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
      justificativa: string | null
      resumoClinco: string | null
      createdAt: Date
    }[]
    evolucoes: { conteudo: string; registradoEm: Date }[]
    prescricoes: {
      observacoes: string | null
      itens: {
        nomeMedicamento: string
        dose: string
        via: string
        frequencia: string
        observacoes: string | null
      }[]
    }[]
    requisicoes: { itens: { nomeExame: string; resultado: string | null }[] }[]
  } | null
}

export function nomePacienteInternacao(p: PacienteCtx): string {
  if (p.nomeCompleto?.trim()) return p.nomeCompleto.trim()
  return obterNomeCompletoPaciente(p.nomeExibicao, p.nomeCriptografado)
}

export function descricaoLeitoInternacao(
  leito: AtendimentoCtx['leito']
): string {
  if (!leito) return ''
  const partes = [leito.ala, leito.codigo]
  if (leito.quarto) partes.push(`Quarto ${leito.quarto}`)
  partes.push(leito.tipo.replace(/_/g, ' '))
  return partes.join(' • ')
}

export function dataInternacaoReferencia(atendimento: {
  updatedAt: Date
  prontuario: { encaminhamentos: { tipo: string; createdAt: Date }[] } | null
}): Date {
  const enc = atendimento.prontuario?.encaminhamentos.find((e) => e.tipo === 'INTERNACAO')
  return enc ? new Date(enc.createdAt) : new Date(atendimento.updatedAt)
}

export function diasInternacaoAteHoje(atendimento: AtendimentoCtx): number {
  return differenceInCalendarDays(new Date(), dataInternacaoReferencia(atendimento))
}

export function diagnosticoPrincipalCtx(atendimento: AtendimentoCtx) {
  const diags = atendimento.prontuario?.diagnosticos ?? []
  return diags.find((d) => d.principal) ?? diags[0] ?? null
}

export function montarSinaisVitaisTextoInternacao(
  sv: NonNullable<AtendimentoCtx['triagem']>['sinaisVitais']
): string {
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

export function sinaisVitaisFormInternacao(
  sv: NonNullable<AtendimentoCtx['triagem']>['sinaisVitais']
) {
  if (!sv) {
    return {
      paSistolica: '',
      paDiastolica: '',
      frequenciaCardiaca: '',
      frequenciaResp: '',
      spo2: '',
      temperatura: '',
      glicemia: '',
    }
  }
  return {
    paSistolica: sv.paSistolica != null ? String(sv.paSistolica) : '',
    paDiastolica: sv.paDiastolica != null ? String(sv.paDiastolica) : '',
    frequenciaCardiaca: sv.frequenciaCardiaca != null ? String(sv.frequenciaCardiaca) : '',
    frequenciaResp: sv.frequenciaResp != null ? String(sv.frequenciaResp) : '',
    spo2: sv.spo2 != null ? String(sv.spo2) : '',
    temperatura: sv.temperatura != null ? String(sv.temperatura) : '',
    glicemia: sv.glicemia != null ? String(sv.glicemia) : '',
  }
}

export function montarTextoAlergias(paciente: PacienteCtx): string {
  const alergias = paciente.alergias ?? []
  if (!alergias.length) return ''
  return alergias
    .map((a) => `${a.descricao}${a.gravidade ? ` (${a.gravidade})` : ''}`)
    .join('; ')
}

export function montarMedicamentosInternacao(atendimento: AtendimentoCtx): string {
  const linhas: string[] = []
  for (const mc of atendimento.paciente.medicamentosCont ?? []) {
    linhas.push(
      `• ${mc.nome}${mc.dose ? ` — ${mc.dose}` : ''}${mc.frequencia ? `, ${mc.frequencia}` : ''} (uso contínuo)`
    )
  }
  for (const p of atendimento.prontuario?.prescricoes ?? []) {
    for (const item of p.itens) {
      linhas.push(
        `• ${item.nomeMedicamento} — ${formatarDosePrescricao(item.dose, (item as { unidadeMedida?: string | null }).unidadeMedida)}, ${item.via}, ${item.frequencia}`
      )
    }
    if (p.observacoes?.trim()) {
      linhas.push(`  Obs. prescrição: ${p.observacoes.trim()}`)
    }
  }
  return linhas.join('\n')
}

export function montarResultadosExamesInternacao(
  requisicoes: NonNullable<AtendimentoCtx['prontuario']>['requisicoes']
): string {
  const linhas: string[] = []
  for (const r of requisicoes ?? []) {
    for (const item of r.itens) {
      if (item.resultado?.trim()) {
        linhas.push(`${item.nomeExame}: ${item.resultado.trim()}`)
      }
    }
  }
  return linhas.join('\n')
}

export function montarResumoClinicoInternacao(atendimento: AtendimentoCtx): string {
  const partes: string[] = []
  const diag = diagnosticoPrincipalCtx(atendimento)
  const anam = atendimento.prontuario?.anamnese
  const tri = atendimento.triagem

  if (diag) partes.push(`${diag.codigoCid} — ${diag.descricaoCid}`)
  if (diag?.hipotese?.trim()) partes.push(`Hipótese: ${diag.hipotese.trim()}`)
  if (anam?.queixaPrincipal) partes.push(`Queixa: ${anam.queixaPrincipal}`)
  else if (tri?.queixaPrincipal) partes.push(`Queixa: ${tri.queixaPrincipal}`)
  if (anam?.hda?.trim()) partes.push(anam.hda.trim())

  const sv = montarSinaisVitaisTextoInternacao(tri?.sinaisVitais ?? null)
  if (sv) partes.push(`Sinais vitais: ${sv}`)

  const exame = exameFisicoParaTexto(anam?.exameFisico)
  if (exame) partes.push(`Exame físico: ${exame}`)

  const alergias = montarTextoAlergias(atendimento.paciente)
  if (alergias) partes.push(`Alergias: ${alergias}`)

  return partes.join('\n\n')
}

export function montarEstadoGeralInternacao(atendimento: AtendimentoCtx): string {
  const tri = atendimento.triagem
  if (!tri) return ''
  const partes: string[] = []
  if (tri.corClassificacao) {
    partes.push(`Classificação Manchester: ${tri.corClassificacao.replace(/_/g, ' ')}`)
  }
  if (tri.queixaPrincipal) partes.push(`Queixa: ${tri.queixaPrincipal}`)
  const sv = montarSinaisVitaisTextoInternacao(tri.sinaisVitais)
  if (sv) partes.push(sv)
  return partes.join(' | ')
}

export function montarTextoSugeridoEvolucao(atendimento: AtendimentoCtx): string {
  const ultima = atendimento.prontuario?.evolucoes[0]
  if (ultima?.conteudo?.trim()) {
    return ultima.conteudo.trim()
  }
  return montarResumoClinicoInternacao(atendimento)
}

export type ItemPrescricaoPrefill = {
  nomeMedicamento: string
  principioAtivo: string
  dose: string
  unidadeMedida: string
  via: 'ORAL' | 'INTRAVENOSA' | 'INTRAMUSCULAR' | 'SUBCUTANEA' | 'TOPICA' | 'INALATORIA' | 'SUBLINGUAL' | 'RETAL' | 'OFTALMICA' | 'OTOLOGICA' | 'NASAL'
  frequencia: string
  quantidadeSolicitada: number
  duracaoDias?: number
  observacoes: string
}

export function montarItensPrescricaoInternacao(atendimento: AtendimentoInternacaoCtx): ItemPrescricaoPrefill[] {
  const itens: ItemPrescricaoPrefill[] = []

  for (const mc of atendimento.paciente.medicamentosCont ?? []) {
    if (!mc.nome?.trim()) continue
    itens.push({
      nomeMedicamento: mc.nome.trim(),
      principioAtivo: '',
      dose: mc.dose?.trim() || 'conforme prescrição anterior',
      unidadeMedida: 'mg',
      via: 'ORAL',
      frequencia: mc.frequencia?.trim() || 'conforme uso contínuo',
      quantidadeSolicitada: 1,
      observacoes: 'Medicamento de uso contínuo',
    })
  }

  return itens
}

/** Copia itens da última prescrição PS para facilitar renovação (uso explícito pelo médico). */
export function copiarItensUltimaPrescricao(atendimento: AtendimentoInternacaoCtx): ItemPrescricaoPrefill[] {
  const itens = montarItensPrescricaoInternacao(atendimento)
  const ultimaPrescricao = atendimento.prontuario?.prescricoes[0]
  if (!ultimaPrescricao?.itens.length) return itens

  for (const item of ultimaPrescricao.itens) {
    if (!item.nomeMedicamento?.trim()) continue
    const jaExiste = itens.some(
      (i) => i.nomeMedicamento.toLowerCase() === item.nomeMedicamento.trim().toLowerCase()
    )
    if (jaExiste) continue
    const viaValida = [
      'ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA',
      'TOPICA', 'INALATORIA', 'SUBLINGUAL', 'RETAL', 'OFTALMICA', 'OTOLOGICA', 'NASAL',
    ].includes(item.via)
      ? (item.via as ItemPrescricaoPrefill['via'])
      : 'ORAL'
    const parsedDose = separarDoseUnidade(
      item.dose?.trim() || '',
      (item as { unidadeMedida?: string | null }).unidadeMedida
    )
    itens.push({
      nomeMedicamento: item.nomeMedicamento.trim(),
      principioAtivo: '',
      dose: parsedDose.dose || 'conforme prescrição anterior',
      unidadeMedida: parsedDose.unidadeMedida || 'mg',
      via: viaValida,
      frequencia: item.frequencia?.trim() || 'conforme prescrição anterior',
      quantidadeSolicitada: 1,
      observacoes: item.observacoes?.trim() ?? '',
    })
  }

  return itens
}

export function montarObservacoesPrescricaoInternacao(atendimento: AtendimentoCtx): string {
  const partes: string[] = []
  const alergias = montarTextoAlergias(atendimento.paciente)
  if (alergias) partes.push(`ALERGIAS: ${alergias}`)
  const cont = atendimento.paciente.medicamentosCont ?? []
  if (cont.length) {
    partes.push(
      'Medicamentos de uso contínuo:\n' +
        cont.map((m) => `• ${m.nome}${m.dose ? ` ${m.dose}` : ''}${m.frequencia ? ` — ${m.frequencia}` : ''}`).join('\n')
    )
  }
  const diag = diagnosticoPrincipalCtx(atendimento)
  if (diag) partes.push(`Diagnóstico: ${diag.codigoCid} — ${diag.descricaoCid}`)
  return partes.join('\n\n')
}

export function funcaoProfissionalDefault(role: string): string | null {
  if (role === 'ENFERMEIRO' || role === 'TECNICO_ENFERMAGEM') return 'ENFERMEIRO'
  if (role === 'MEDICO' || role === 'DIRETOR_CLINICO') return 'MEDICO'
  return null
}

export function identificacaoPacienteInternacao(atendimento: AtendimentoCtx) {
  const dataInt = dataInternacaoReferencia(atendimento)
  const diag = diagnosticoPrincipalCtx(atendimento)
  return {
    nomePaciente: nomePacienteInternacao(atendimento.paciente),
    numeroProntuario: atendimento.numeroAtendimento,
    dataNascimento: format(new Date(atendimento.paciente.dataNascimento), 'yyyy-MM-dd'),
    sexo: ['MASCULINO', 'FEMININO', 'INTERSEXO'].includes(atendimento.paciente.sexoBiologico)
      ? atendimento.paciente.sexoBiologico
      : 'NAO_INFORMADO',
    setorUnidade: atendimento.setor ?? '',
    leitoDescricao: descricaoLeitoInternacao(atendimento.leito),
    dataInternacao: format(dataInt, 'yyyy-MM-dd'),
    diasInternacao: diasInternacaoAteHoje(atendimento),
    diagnosticoPrincipal: diag ? `${diag.codigoCid} — ${diag.descricaoCid}` : '',
    cidPrincipal: diag?.codigoCid ?? '',
    numeroAtendimento: atendimento.numeroAtendimento,
    atendimentoId: atendimento.id,
  }
}

export function pacienteIdoso(atendimento: AtendimentoCtx): boolean {
  return differenceInCalendarDays(new Date(), atendimento.paciente.dataNascimento) / 365.25 >= 60
}

export type AtendimentoInternacaoCtx = AtendimentoCtx
