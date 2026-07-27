// lib/ccih-internacao.ts — Pré-preenchimento e persistência da ficha CCIH

import { format, differenceInYears } from 'date-fns'
import type { FichaCcihForm, FormularioCcihNotificacao } from '@/lib/validations/ccih'
import type { FichaCcih as FichaCcihModel } from '@prisma/client'
import {
  type AtendimentoInternacaoCtx,
  identificacaoPacienteInternacao,
  descricaoLeitoInternacao,
  mesclarSecaoJson,
} from '@/lib/prefill-internamento'

type AtendimentoCcih = AtendimentoInternacaoCtx

export type FichaCcihPrefill = FichaCcihForm & {
  atendimentoId: string
  numeroAtendimento: string
  diasInternacao: number | null
}

export const LABEL_STATUS_FICHA_CCIH: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  NOTIFICADO: 'Notificado à CCIH',
  EM_ANALISE: 'Em análise',
  CONCLUIDO: 'Concluído',
}

export const LABEL_CLASSIFICACAO_INFECCAO: Record<string, string> = {
  ITU: 'Infecção do trato urinário (ITU)',
  PNEUMONIA_VENTILACAO: 'Pneumonia associada à ventilação mecânica (PAVM)',
  ISC: 'Infecção de sítio cirúrgico (ISC)',
  ICS: 'Infecção de corrente sanguínea (ICS)',
  BACTERIEMIA_PRIMARIA: 'Bacteriemia primária',
  MENINGITE: 'Meningite',
  INFECCAO_CATETER: 'Infecção associada a cateter',
  OUTRA: 'Outra',
}

function fmtData(d: Date | null | undefined): string {
  if (!d) return ''
  return format(new Date(d), 'yyyy-MM-dd')
}

function sexoParaTexto(sexo: string | null | undefined): string {
  if (sexo === 'MASCULINO') return 'Masculino'
  if (sexo === 'FEMININO') return 'Feminino'
  if (sexo === 'INTERSEXO') return 'Intersexo'
  return 'Não informado'
}

function calcularIdade(dataNascimento: string | Date | null | undefined): number | null {
  if (!dataNascimento) return null
  const dt = typeof dataNascimento === 'string' ? new Date(`${dataNascimento}T12:00:00`) : dataNascimento
  if (Number.isNaN(dt.getTime())) return null
  return differenceInYears(new Date(), dt)
}

const germeVazio = () => ({ nome_microorganismo: '', antibiograma_sensibilidade: '' })

export function formularioCcihVazio(): FormularioCcihNotificacao {
  return {
    controle_interno: { numero_controle: '', numero_registro: '' },
    hospital: '',
    hospital_unidade: { clinica_servico: '', andar_ala: '', enfermaria_leito: '' },
    data_notificacao: '',
    medico_responsavel: { nome: '', crm_carimbo: '', assinatura_carimbo_digital: '' },
    paciente_internacao: {
      nome: '',
      prontuario: '',
      sexo: '',
      idade: null,
      idade_unidade: 'anos',
      nome_mae: '',
      prontuario_mae: '',
      clinica: '',
      andar: '',
      data_internacao: '',
      alta_em: '',
      obito: { houve_obito: false, data: '', causa: '', causa_relacionada_infeccao: false },
      diagnostico: '',
    },
    dados_cirurgicos: {
      houve_cirurgia: false,
      nome_cirurgia: '',
      descricao_cirurgia: '',
      data_cirurgia: '',
      duracao_horas_minutos: '',
      cirurgiao: '',
      tipo_cirurgia: '',
      classificacao_cirurgia: '',
      anestesista: '',
      tipo_anestesia: '',
      utilizou_implante_protese: false,
    },
    dados_obstetricos: {
      parto_transpelvico: false,
      obstetra: '',
      data: '',
      data_parto: '',
      bolsa_rota: { apresentou: false, numero_horas: null, tempo_horas: null },
      episiorrafia: false,
      placenta: '',
      placenta_completa: true,
    },
    procedimentos_risco_realizados: {
      assistencia_ventilatoria: false,
      disseccao_venosa: false,
      puncao_lombar: false,
      biopsia: false,
      entubacao: false,
      puncao_toracica: false,
      cateterismo_vesical: false,
      npt: false,
      npt_nutricao_parenteral: false,
      hemotransfusao: false,
      cateterismo_venoso: false,
      nebulizacao: false,
      traqueostomia: false,
      puncao_venosa: false,
      puncao_abdominal: false,
      procedimento_complemento_texto: '',
      outros_procedimentos_texto: '',
    },
    infeccao_notificada: {
      apresenta_infeccao: false,
      infeccao_opcao: '',
      origem_infeccao: '',
      classificacao: '',
      localizacao_topografica: {
        coto_umbilical: false,
        ocular: false,
        puerperal: false,
        cutanea_nao_cirurgica: false,
        ouvido: false,
        respiratoria: false,
        ferida_cirurgica: false,
        oral: false,
        urinaria: false,
        gastro_intestinal: false,
        peritonial: false,
        venosa_flebite: false,
        outras_topografias_texto: '',
      },
    },
    uso_antimicrobianos: {
      houve_uso: false,
      uso_antimicrobiano: '',
      finalidade: '',
      medicamentos: [],
    },
    dados_cultura: {
      realizada: false,
      cultura_realizada: false,
      tipos: '',
      tipo_material_coletado: '',
      data_coleta: '',
      resultados: '',
      observacoes_laboratorio: '',
      germes: {
        germe_1: germeVazio(),
        germe_2: germeVazio(),
        germe_3: germeVazio(),
      },
    },
  }
}

function topografiaLegadoParaFlags(tipo: string | null | undefined, topografia: string | null | undefined) {
  const flags = formularioCcihVazio().infeccao_notificada!.localizacao_topografica!
  const t = `${tipo ?? ''} ${topografia ?? ''}`.toUpperCase()
  if (t.includes('ITU') || t.includes('URIN')) flags.urinaria = true
  if (t.includes('PNEUM') || t.includes('RESP')) flags.respiratoria = true
  if (t.includes('ISC') || t.includes('CIRURG')) flags.ferida_cirurgica = true
  if (t.includes('CATETER') || t.includes('VENOS') || t.includes('FLEB')) flags.venosa_flebite = true
  if (t.includes('MENING')) flags.oral = true
  if (topografia?.trim()) flags.outras_topografias_texto = topografia.trim()
  return flags
}

function legadoParaFormulario(ficha: FichaCcihModel): FormularioCcihNotificacao {
  const base = formularioCcihVazio()
  const disp = (ficha.dispositivos ?? {}) as Record<string, unknown>
  const classificacao =
    ficha.tipoInfeccao === 'OUTRA'
      ? ficha.tipoInfeccaoOutro ?? ''
      : ficha.tipoInfeccao
        ? LABEL_CLASSIFICACAO_INFECCAO[ficha.tipoInfeccao] ?? ficha.tipoInfeccao
        : ''

  const medsTexto = [ficha.antibioticoterapiaEmUso, ficha.antibioticoterapiaPrevio]
    .filter(Boolean)
    .join('\n')

  return {
    ...base,
    hospital: '',
    data_notificacao: fmtData(ficha.dataNotificacao),
    medico_responsavel: {
      nome: ficha.nomeProfissionalNotificador ?? '',
      crm_carimbo: ficha.conselhoProfissional ?? '',
    },
    paciente_internacao: {
      nome: ficha.nomePaciente ?? '',
      prontuario: ficha.numeroProntuario ?? '',
      sexo: sexoParaTexto(ficha.sexo),
      idade: calcularIdade(ficha.dataNascimento),
      clinica: ficha.setorUnidade ?? '',
      andar: ficha.leitoDescricao ?? '',
      data_internacao: fmtData(ficha.dataInternacao),
      alta_em: '',
      obito: { houve_obito: false, data: '', causa: '', causa_relacionada_infeccao: false },
      diagnostico: ficha.diagnosticoPrincipal ?? '',
    },
    hospital_unidade: {
      clinica_servico: ficha.setorUnidade ?? '',
      andar_ala: ficha.leitoDescricao ?? '',
      enfermaria_leito: ficha.leitoDescricao ?? '',
    },
    dados_cirurgicos: {
      ...base.dados_cirurgicos!,
      houve_cirurgia: Boolean(disp.cirurgiaRecente),
      descricao_cirurgia: String(disp.descricaoCirurgia ?? ficha.procedimentoRelacionado ?? ''),
      data_cirurgia: String(disp.dataCirurgia ?? ''),
    },
    procedimentos_risco_realizados: {
      ...base.procedimentos_risco_realizados!,
      assistencia_ventilatoria: Boolean(disp.ventilacaoMecanica),
      cateterismo_vesical: Boolean(disp.sondaVesical),
      cateterismo_venoso: Boolean(disp.cateterVenosoCentral),
      outros_procedimentos_texto: String(disp.outrosDispositivos ?? ''),
    },
    infeccao_notificada: {
      apresenta_infeccao: Boolean(ficha.tipoInfeccao || ficha.sinaisSintomas?.trim()),
      infeccao_opcao: ficha.tipoInfeccao || ficha.sinaisSintomas?.trim() ? 'SIM' : 'NAO',
      origem_infeccao: '',
      classificacao,
      localizacao_topografica: topografiaLegadoParaFlags(ficha.tipoInfeccao, ficha.topografia),
    },
    uso_antimicrobianos: {
      houve_uso: Boolean(medsTexto.trim()),
      finalidade: '',
      medicamentos: medsTexto.trim()
        ? [{ tipo_nome: medsTexto, dose: '', data_inicio: '', data_termino: '' }]
        : base.uso_antimicrobianos!.medicamentos,
    },
    dados_cultura: {
      realizada: Boolean(ficha.resultadosLaboratorio?.trim() || ficha.microorganismoIdentificado?.trim()),
      cultura_realizada: Boolean(ficha.resultadosLaboratorio?.trim() || ficha.microorganismoIdentificado?.trim()),
      tipos: ficha.microorganismoIdentificado ?? '',
      tipo_material_coletado: '',
      data_coleta: fmtData(ficha.dataInicioSinais),
      resultados: [ficha.resultadosLaboratorio, ficha.sinaisSintomas].filter((v) => v?.trim()).join('\n\n'),
      observacoes_laboratorio: ficha.sensibilidadeAntimicrobianos ?? '',
      germes: {
        germe_1: {
          nome_microorganismo: ficha.microorganismoIdentificado ?? '',
          antibiograma_sensibilidade: ficha.sensibilidadeAntimicrobianos ?? '',
        },
        germe_2: germeVazio(),
        germe_3: germeVazio(),
      },
    },
  }
}

function parseFormularioJson(raw: unknown): FormularioCcihNotificacao | null {
  if (!raw || typeof raw !== 'object') return null
  return schemaSafeFormulario(raw)
}

function schemaSafeFormulario(raw: unknown): FormularioCcihNotificacao {
  const base = formularioCcihVazio()
  const r = raw as Record<string, unknown>
  const procRaw = (r.procedimentos_risco_realizados as Record<string, unknown>) ?? {}
  const proc = mesclarSecaoJson(base.procedimentos_risco_realizados!, procRaw)
  if (procRaw.npt || procRaw.npt_nutricao_parenteral) {
    proc.npt = Boolean(procRaw.npt ?? procRaw.npt_nutricao_parenteral)
    proc.npt_nutricao_parenteral = Boolean(procRaw.npt_nutricao_parenteral ?? procRaw.npt)
  }

  const cultRaw = (r.dados_cultura as Record<string, unknown>) ?? {}
  const cultBase = base.dados_cultura!
  const germesRaw = (cultRaw.germes as Record<string, unknown>) ?? {}
  const cultura = {
    ...mesclarSecaoJson(cultBase, cultRaw),
    realizada: Boolean(cultRaw.realizada ?? cultRaw.cultura_realizada ?? cultBase.realizada),
    cultura_realizada: Boolean(cultRaw.cultura_realizada ?? cultRaw.realizada ?? cultBase.cultura_realizada),
    tipo_material_coletado: String(
      cultRaw.tipo_material_coletado ?? cultRaw.tipos ?? cultBase.tipo_material_coletado
    ),
    tipos: String(cultRaw.tipos ?? cultRaw.tipo_material_coletado ?? cultBase.tipos),
    germes: {
      germe_1: mesclarSecaoJson(cultBase.germes!.germe_1!, germesRaw.germe_1 as Record<string, unknown>),
      germe_2: mesclarSecaoJson(cultBase.germes!.germe_2!, germesRaw.germe_2 as Record<string, unknown>),
      germe_3: mesclarSecaoJson(cultBase.germes!.germe_3!, germesRaw.germe_3 as Record<string, unknown>),
    },
  }

  const obsRaw = (r.dados_obstetricos as Record<string, unknown>) ?? {}
  const bolsaRaw = (obsRaw.bolsa_rota as Record<string, unknown>) ?? {}
  const obstetricos = {
    ...mesclarSecaoJson(base.dados_obstetricos!, obsRaw),
    data: String(obsRaw.data ?? obsRaw.data_parto ?? base.dados_obstetricos!.data),
    data_parto: String(obsRaw.data_parto ?? obsRaw.data ?? base.dados_obstetricos!.data_parto),
    bolsa_rota: {
      ...mesclarSecaoJson(base.dados_obstetricos!.bolsa_rota!, bolsaRaw),
      numero_horas:
        bolsaRaw.numero_horas != null
          ? Number(bolsaRaw.numero_horas)
          : bolsaRaw.tempo_horas != null
            ? Number(bolsaRaw.tempo_horas)
            : base.dados_obstetricos!.bolsa_rota!.numero_horas,
      tempo_horas:
        bolsaRaw.tempo_horas != null
          ? Number(bolsaRaw.tempo_horas)
          : bolsaRaw.numero_horas != null
            ? Number(bolsaRaw.numero_horas)
            : base.dados_obstetricos!.bolsa_rota!.tempo_horas,
    },
  }

  const cirRaw = (r.dados_cirurgicos as Record<string, unknown>) ?? {}
  const cirurgicos = {
    ...mesclarSecaoJson(base.dados_cirurgicos!, cirRaw),
    nome_cirurgia: String(cirRaw.nome_cirurgia ?? cirRaw.descricao_cirurgia ?? base.dados_cirurgicos!.nome_cirurgia),
    descricao_cirurgia: String(cirRaw.descricao_cirurgia ?? cirRaw.nome_cirurgia ?? base.dados_cirurgicos!.descricao_cirurgia),
    classificacao_cirurgia: String(
      cirRaw.classificacao_cirurgia ?? cirRaw.tipo_cirurgia ?? base.dados_cirurgicos!.classificacao_cirurgia
    ),
  }

  const infRaw = (r.infeccao_notificada as Record<string, unknown>) ?? {}
  const infeccao = {
    ...mesclarSecaoJson(base.infeccao_notificada!, infRaw),
    origem_infeccao: String(
      infRaw.origem_infeccao ?? infRaw.infeccao_opcao ?? base.infeccao_notificada!.origem_infeccao
    ),
    localizacao_topografica: mesclarSecaoJson(
      base.infeccao_notificada!.localizacao_topografica!,
      (infRaw.localizacao_topografica as Record<string, unknown>) ?? undefined
    ),
  }

  const antiRaw = (r.uso_antimicrobianos as Record<string, unknown>) ?? {}
  const medicamentos = Array.isArray(antiRaw.medicamentos)
    ? (antiRaw.medicamentos as Record<string, unknown>[]).map((m) => ({
        ...mesclarSecaoJson(base.uso_antimicrobianos!.medicamentos![0], m),
        tipo_nome: String(m.tipo_nome ?? m.nome_antimicrobiano ?? ''),
        nome_antimicrobiano: String(m.nome_antimicrobiano ?? m.tipo_nome ?? ''),
        dose: String(m.dose ?? m.dose_posologia ?? ''),
        dose_posologia: String(m.dose_posologia ?? m.dose ?? ''),
      }))
    : base.uso_antimicrobianos!.medicamentos

  return {
    controle_interno: mesclarSecaoJson(
      base.controle_interno!,
      (r.controle_interno as Record<string, unknown>) ?? undefined
    ),
    hospital: String(r.hospital ?? base.hospital),
    hospital_unidade: mesclarSecaoJson(
      base.hospital_unidade!,
      (r.hospital_unidade as Record<string, unknown>) ?? undefined
    ),
    data_notificacao: String(r.data_notificacao ?? base.data_notificacao),
    medico_responsavel: mesclarSecaoJson(
      base.medico_responsavel!,
      (r.medico_responsavel as Record<string, unknown>) ?? undefined
    ),
    paciente_internacao: {
      ...mesclarSecaoJson(
        base.paciente_internacao,
        (r.paciente_internacao as Record<string, unknown>) ?? undefined
      ),
      nome: String(
        (r.paciente_internacao as Record<string, unknown>)?.nome ?? base.paciente_internacao.nome
      ),
      idade:
        (r.paciente_internacao as Record<string, unknown>)?.idade != null
          ? Number((r.paciente_internacao as Record<string, unknown>).idade)
          : base.paciente_internacao.idade,
      obito: mesclarSecaoJson(
        base.paciente_internacao.obito!,
        ((r.paciente_internacao as Record<string, unknown>)?.obito as Record<string, unknown>) ?? undefined
      ),
    } as FormularioCcihNotificacao['paciente_internacao'],
    dados_cirurgicos: cirurgicos,
    dados_obstetricos: obstetricos,
    procedimentos_risco_realizados: proc,
    infeccao_notificada: infeccao,
    uso_antimicrobianos: {
      ...mesclarSecaoJson(base.uso_antimicrobianos!, antiRaw),
      medicamentos,
    },
    dados_cultura: cultura,
  }
}

function fichaParaForm(ficha: FichaCcihModel): FichaCcihForm {
  const formulario =
    parseFormularioJson(ficha.dadosFormulario) ?? legadoParaFormulario(ficha)

  return {
    status: ficha.status as FichaCcihForm['status'],
    formulario,
    observacoesEquipe: ficha.observacoesEquipe ?? '',
    parecerCcih: ficha.parecerCcih ?? '',
  }
}

function mesclarFormularioCcih(base: FormularioCcihNotificacao, salvo: FormularioCcihNotificacao): FormularioCcihNotificacao {
  const vazio = formularioCcihVazio()
  const proc = mesclarSecaoJson(base.procedimentos_risco_realizados!, salvo.procedimentos_risco_realizados)
  proc.npt = proc.npt || proc.npt_nutricao_parenteral
  proc.npt_nutricao_parenteral = proc.npt_nutricao_parenteral || proc.npt

  return {
    controle_interno: mesclarSecaoJson(base.controle_interno!, salvo.controle_interno),
    hospital: salvo.hospital?.trim() ? salvo.hospital : base.hospital,
    hospital_unidade: {
      ...mesclarSecaoJson(base.hospital_unidade!, salvo.hospital_unidade),
      clinica_servico:
        salvo.hospital_unidade?.clinica_servico?.trim() ||
        salvo.paciente_internacao.clinica?.trim() ||
        base.hospital_unidade?.clinica_servico,
      andar_ala:
        salvo.hospital_unidade?.andar_ala?.trim() ||
        salvo.paciente_internacao.andar?.trim() ||
        base.hospital_unidade?.andar_ala,
      enfermaria_leito:
        salvo.hospital_unidade?.enfermaria_leito?.trim() || base.hospital_unidade?.enfermaria_leito,
    },
    data_notificacao: salvo.data_notificacao?.trim() ? salvo.data_notificacao : base.data_notificacao,
    medico_responsavel: mesclarSecaoJson(base.medico_responsavel!, salvo.medico_responsavel),
    paciente_internacao: {
      ...mesclarSecaoJson(base.paciente_internacao, salvo.paciente_internacao),
      idade: salvo.paciente_internacao.idade ?? base.paciente_internacao.idade,
      idade_unidade: salvo.paciente_internacao.idade_unidade?.trim()
        ? salvo.paciente_internacao.idade_unidade
        : base.paciente_internacao.idade_unidade,
      nome_mae: salvo.paciente_internacao.nome_mae?.trim()
        ? salvo.paciente_internacao.nome_mae
        : base.paciente_internacao.nome_mae,
      obito: mesclarSecaoJson(base.paciente_internacao.obito!, salvo.paciente_internacao.obito),
    },
    dados_cirurgicos: mesclarSecaoJson(base.dados_cirurgicos!, salvo.dados_cirurgicos),
    dados_obstetricos: {
      ...mesclarSecaoJson(base.dados_obstetricos!, salvo.dados_obstetricos),
      bolsa_rota: mesclarSecaoJson(vazio.dados_obstetricos!.bolsa_rota!, salvo.dados_obstetricos?.bolsa_rota),
    },
    procedimentos_risco_realizados: proc,
    infeccao_notificada: {
      ...mesclarSecaoJson(base.infeccao_notificada!, salvo.infeccao_notificada),
      infeccao_opcao: salvo.infeccao_notificada?.infeccao_opcao?.trim()
        ? salvo.infeccao_notificada.infeccao_opcao
        : base.infeccao_notificada?.infeccao_opcao ?? '',
      origem_infeccao: salvo.infeccao_notificada?.origem_infeccao?.trim()
        ? salvo.infeccao_notificada.origem_infeccao
        : salvo.infeccao_notificada?.infeccao_opcao?.trim()
          ? salvo.infeccao_notificada.infeccao_opcao
          : base.infeccao_notificada?.origem_infeccao ?? '',
      apresenta_infeccao:
        salvo.infeccao_notificada?.infeccao_opcao
          ? salvo.infeccao_notificada.infeccao_opcao !== 'NAO'
          : (salvo.infeccao_notificada?.apresenta_infeccao ?? base.infeccao_notificada?.apresenta_infeccao),
      localizacao_topografica: mesclarSecaoJson(
        base.infeccao_notificada!.localizacao_topografica!,
        salvo.infeccao_notificada?.localizacao_topografica
      ),
    },
    uso_antimicrobianos: {
      houve_uso: salvo.uso_antimicrobianos?.houve_uso ?? base.uso_antimicrobianos?.houve_uso,
      uso_antimicrobiano: salvo.uso_antimicrobianos?.uso_antimicrobiano?.trim()
        ? salvo.uso_antimicrobianos.uso_antimicrobiano
        : base.uso_antimicrobianos?.uso_antimicrobiano ?? '',
      finalidade: salvo.uso_antimicrobianos?.finalidade?.trim()
        ? salvo.uso_antimicrobianos.finalidade
        : base.uso_antimicrobianos?.finalidade ?? '',
      medicamentos:
        salvo.uso_antimicrobianos?.medicamentos?.some((m) => m.tipo_nome?.trim() || m.nome_antimicrobiano?.trim())
          ? salvo.uso_antimicrobianos.medicamentos
          : base.uso_antimicrobianos?.medicamentos,
    },
    dados_cultura: {
      ...mesclarSecaoJson(base.dados_cultura!, salvo.dados_cultura),
      germes: {
        germe_1: mesclarSecaoJson(
          base.dados_cultura!.germes!.germe_1!,
          salvo.dados_cultura?.germes?.germe_1
        ),
        germe_2: mesclarSecaoJson(
          base.dados_cultura!.germes!.germe_2!,
          salvo.dados_cultura?.germes?.germe_2
        ),
        germe_3: mesclarSecaoJson(
          base.dados_cultura!.germes!.germe_3!,
          salvo.dados_cultura?.germes?.germe_3
        ),
      },
    },
  }
}

export function montarPrefillFichaCcih(
  atendimento: AtendimentoCcih,
  fichaExistente: FichaCcihModel | null,
  usuarioSessao: { nome: string; crm?: string | null; role: string },
  instituicao?: { nomeInstituicao?: string | null } | null
): FichaCcihPrefill {
  const id = identificacaoPacienteInternacao(atendimento)
  const hoje = format(new Date(), 'yyyy-MM-dd')

  const leitoDesc = descricaoLeitoInternacao(atendimento.leito)

  const baseForm: FormularioCcihNotificacao = {
    ...formularioCcihVazio(),
    hospital: instituicao?.nomeInstituicao?.trim() ?? '',
    hospital_unidade: {
      clinica_servico: id.setorUnidade,
      andar_ala: atendimento.leito?.ala ?? '',
      enfermaria_leito: leitoDesc,
    },
    data_notificacao: hoje,
    medico_responsavel: {
      nome: atendimento.medico?.nome ?? usuarioSessao.nome,
      crm_carimbo: atendimento.medico?.crm ?? usuarioSessao.crm ?? '',
      assinatura_carimbo_digital: '',
    },
    paciente_internacao: {
      nome: id.nomePaciente,
      prontuario: id.numeroProntuario,
      sexo: sexoParaTexto(id.sexo),
      idade: calcularIdade(id.dataNascimento),
      idade_unidade: 'anos',
      nome_mae: '',
      prontuario_mae: '',
      clinica: '',
      andar: '',
      data_internacao: id.dataInternacao,
      alta_em: '',
      obito: { houve_obito: false, data: '', causa: '', causa_relacionada_infeccao: false },
      diagnostico: id.diagnosticoPrincipal,
    },
    uso_antimicrobianos: formularioCcihVazio().uso_antimicrobianos!,
    dados_cultura: {
      ...formularioCcihVazio().dados_cultura!,
      data_coleta: '',
      resultados: '',
      realizada: false,
      cultura_realizada: false,
    },
  }

  const base: FichaCcihPrefill = {
    atendimentoId: id.atendimentoId,
    numeroAtendimento: id.numeroAtendimento,
    diasInternacao: id.diasInternacao,
    status: 'RASCUNHO',
    formulario: baseForm,
    observacoesEquipe: '',
    parecerCcih: '',
  }

  if (!fichaExistente) return base

  const salvo = fichaParaForm(fichaExistente)
  return {
    ...salvo,
    atendimentoId: id.atendimentoId,
    numeroAtendimento: id.numeroAtendimento,
    diasInternacao: id.diasInternacao,
    formulario: mesclarFormularioCcih(baseForm, salvo.formulario),
    observacoesEquipe: salvo.observacoesEquipe?.trim() ? salvo.observacoesEquipe : base.observacoesEquipe,
    parecerCcih: salvo.parecerCcih?.trim() ? salvo.parecerCcih : base.parecerCcih,
  }
}

export function dadosFichaCcihParaPrisma(dados: FichaCcihForm, preenchidoPorId: string) {
  const p = dados.formulario.paciente_internacao
  const med = dados.formulario.medico_responsavel

  return {
    status: dados.status,
    dadosFormulario: dados.formulario as object,
    nomePaciente: p.nome.trim(),
    numeroProntuario: p.prontuario?.trim() || null,
    setorUnidade:
      dados.formulario.hospital_unidade?.clinica_servico?.trim() || p.clinica?.trim() || null,
    leitoDescricao:
      dados.formulario.hospital_unidade?.enfermaria_leito?.trim() || p.andar?.trim() || null,
    diagnosticoPrincipal: p.diagnostico?.trim() || null,
    nomeProfissionalNotificador: med?.nome?.trim() || null,
    conselhoProfissional: med?.crm_carimbo?.trim() || null,
    observacoesEquipe: dados.observacoesEquipe?.trim() || null,
    parecerCcih: dados.parecerCcih?.trim() || null,
    preenchidoPorId,
  }
}

export const LABEL_INFECCAO_OPCAO: Record<string, string> = {
  SIM: 'Sim',
  NAO: 'Não',
  COMUNITARIA: 'Comunitária',
  HOSPITALAR: 'Hospitalar',
  AMBAS: 'Ambas',
}

export const LABEL_TIPO_INFECCAO = LABEL_CLASSIFICACAO_INFECCAO
