// lib/ficha-internacao-alta.ts — Folha de Internação e Alta Hospitalar

import { format, differenceInYears } from 'date-fns'
import { descriptografar } from '@/lib/encryption'
import { obterNomeCompletoPaciente } from '@/lib/nome-paciente-exibicao'
import { exameFisicoParaTexto } from '@/lib/ficha-urgencia'
import { mesclarPrefill } from '@/lib/prefill-internamento'
import type { FichaInternacaoAlta, Prisma } from '@prisma/client'
import type { FichaInternacaoAltaForm } from '@/lib/validations/ficha-internacao-alta'

export type FichaInternacaoAltaPrefill = FichaInternacaoAltaForm

type EvolucaoLinhaFicha = NonNullable<FichaInternacaoAltaForm['evolucoes']>[number]

const EVOLUCAO_LINHA_VAZIA = (): EvolucaoLinhaFicha => ({
  data: '',
  hora: '',
  evolucaoClinica: '',
  relatorioEnfermagem: '',
})

export function camposPosInternacaoVazios(): Pick<
  FichaInternacaoAltaForm,
  | 'evolucoes'
  | 'altaCurado'
  | 'altaMelhorado'
  | 'altaInternado'
  | 'altaPiorado'
  | 'obito'
  | 'obitoData'
  | 'obitoHora'
  | 'obitoMais48h'
  | 'obitoMenos48h'
  | 'motivoDecisaoMedica'
  | 'motivoAltaPedida'
  | 'motivoTransferencia'
  | 'motivoIndisciplina'
  | 'transferenciaPara'
  | 'diagnosticoDefinitivo'
  | 'observacaoAlta'
  | 'dataAlta'
  | 'medicoCremepeAlta'
> {
  return {
    evolucoes: [EVOLUCAO_LINHA_VAZIA()],
    altaCurado: false,
    altaMelhorado: false,
    altaInternado: false,
    altaPiorado: false,
    obito: false,
    obitoData: '',
    obitoHora: '',
    obitoMais48h: false,
    obitoMenos48h: false,
    motivoDecisaoMedica: false,
    motivoAltaPedida: false,
    motivoTransferencia: false,
    motivoIndisciplina: false,
    transferenciaPara: '',
    diagnosticoDefinitivo: '',
    observacaoAlta: '',
    dataAlta: '',
    medicoCremepeAlta: '',
  }
}

const CAMPOS_POS_INTERNACAO = [
  'evolucoes',
  'altaCurado',
  'altaMelhorado',
  'altaInternado',
  'altaPiorado',
  'obito',
  'obitoData',
  'obitoHora',
  'obitoMais48h',
  'obitoMenos48h',
  'motivoDecisaoMedica',
  'motivoAltaPedida',
  'motivoTransferencia',
  'motivoIndisciplina',
  'transferenciaPara',
  'diagnosticoDefinitivo',
  'observacaoAlta',
  'dataAlta',
  'medicoCremepeAlta',
] as const satisfies readonly (keyof FichaInternacaoAltaForm)[]

export function mesclarFichaPorSecao(
  existente: Partial<FichaInternacaoAltaForm>,
  novo: FichaInternacaoAltaForm,
  secao: 'ADMISSAO' | 'ALTA'
): FichaInternacaoAltaForm {
  const posVazio = camposPosInternacaoVazios()
  if (secao === 'ADMISSAO') {
    const pos = {} as Record<string, unknown>
    for (const chave of CAMPOS_POS_INTERNACAO) {
      pos[chave] = existente[chave] ?? posVazio[chave as keyof typeof posVazio]
    }
    return { ...novo, ...pos } as FichaInternacaoAltaForm
  }

  return {
    ...existente,
    ...novo,
    status: novo.status ?? existente.status ?? 'RASCUNHO',
    nome: novo.nome || existente.nome || '',
    evolucoes: existente.evolucoes ?? posVazio.evolucoes,
  } as FichaInternacaoAltaForm
}

function evolucoesTemConteudo(evolucoes: EvolucaoLinhaFicha[] | undefined): boolean {
  if (!evolucoes?.length) return false
  return evolucoes.some(
    (l) =>
      l.data?.trim() ||
      l.hora?.trim() ||
      l.evolucaoClinica?.trim() ||
      l.relatorioEnfermagem?.trim()
  )
}

function stripHtmlBasico(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function telefoneTexto(telefoneCriptografado: string | null): string {
  if (!telefoneCriptografado) return ''
  try {
    return descriptografar(telefoneCriptografado).replace(/\D/g, '')
  } catch {
    return ''
  }
}

function sexoLabel(sexo: string): string {
  if (sexo === 'FEMININO') return 'Feminino'
  if (sexo === 'MASCULINO') return 'Masculino'
  if (sexo === 'INTERSEXO') return 'Intersexo'
  return 'Não informado'
}

type FichaEvolucaoTurnoCtx = {
  turno: string
  dataReferencia: Date
  registradoEm: Date | null
  estadoGeral: string | null
  evolucaoClinica: string | null
  dietaEliminacoes: string | null
  medicamentosProcedimentos: string | null
  intercorrencias: string | null
  condutaProximoTurno: string | null
  nomeProfissional: string | null
}

type EvolucaoMedicaCtx = {
  conteudo: string
  registradoEm: Date
  autor: { nome: string } | null
}

type AtendimentoFicha = {
  id: string
  numeroAtendimento: string
  status: string
  setor: string | null
  paciente: {
    nomeCriptografado: string
    nomeExibicao: string
    dataNascimento: Date
    sexoBiologico: string
    cns: string | null
    nomeMae: string | null
    naturalidade: string | null
    profissao: string | null
    racaCor: string | null
    convenio: string | null
    telefoneCriptografado: string | null
    acompanhanteNome: string | null
    acompanhanteTelefone: string | null
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
  origem: { descricao: string; procedenciaFicha: string | null } | null
  triagem: {
    queixaPrincipal: string
    sinaisVitais: {
      paSistolica: number | null
      paDiastolica: number | null
      frequenciaCardiaca: number | null
      temperatura: unknown
      peso: unknown
    } | null
  } | null
  prontuario: {
    anamnese: { hda: string | null; exameFisico: unknown } | null
    diagnosticos: { codigoCid: string; descricaoCid: string; principal: boolean }[]
    encaminhamentos: { especialidade: string; resumoClinco: string | null }[]
    evolucoes?: EvolucaoMedicaCtx[]
  } | null
  fichasEvolucaoTurno?: FichaEvolucaoTurnoCtx[]
  fichaMultidisciplinar?: { enfermagem: unknown } | null
}

type InstituicaoDados = {
  nomeInstituicao: string
} | null

function montarEndereco(
  end: NonNullable<AtendimentoFicha['paciente']['endereco']>
): string {
  return `${end.logradouro}, ${end.numero}${end.complemento ? ` - ${end.complemento}` : ''} - ${end.bairro} - ${end.cidade}/${end.estado}`
}

function montarDiagnosticoProvisorio(atendimento: AtendimentoFicha): string {
  const diag =
    atendimento.prontuario?.diagnosticos.find((d) => d.principal) ??
    atendimento.prontuario?.diagnosticos[0]
  if (!diag) return ''
  return `${diag.codigoCid} — ${diag.descricaoCid}`
}

function montarRelatorioEnfermagemTurno(ficha: FichaEvolucaoTurnoCtx): string {
  const partes: string[] = []
  const turno = ficha.turno === 'DIURNA' ? 'Turno diurno' : 'Turno noturno'
  partes.push(turno)
  if (ficha.estadoGeral?.trim()) partes.push(`Estado geral: ${ficha.estadoGeral.trim()}`)
  if (ficha.dietaEliminacoes?.trim()) partes.push(`Dieta/eliminações: ${ficha.dietaEliminacoes.trim()}`)
  if (ficha.medicamentosProcedimentos?.trim()) {
    partes.push(`Medicações/procedimentos: ${ficha.medicamentosProcedimentos.trim()}`)
  }
  if (ficha.intercorrencias?.trim()) partes.push(`Intercorrências: ${ficha.intercorrencias.trim()}`)
  if (ficha.condutaProximoTurno?.trim()) {
    partes.push(`Conduta próximo turno: ${ficha.condutaProximoTurno.trim()}`)
  }
  if (ficha.nomeProfissional?.trim()) partes.push(`Profissional: ${ficha.nomeProfissional.trim()}`)
  return partes.join('\n')
}

function montarRelatorioMultidisciplinarEnfermagem(enfermagem: unknown): string {
  if (!enfermagem || typeof enfermagem !== 'object') return ''
  const e = enfermagem as Record<string, unknown>
  const partes: string[] = []
  if (typeof e.diagnosticoEnfermagem === 'string' && e.diagnosticoEnfermagem.trim()) {
    partes.push(`Diagnóstico de enfermagem: ${e.diagnosticoEnfermagem.trim()}`)
  }
  if (typeof e.intervencoes === 'string' && e.intervencoes.trim()) {
    partes.push(`Intervenções: ${e.intervencoes.trim()}`)
  }
  if (typeof e.integridadePele === 'string' && e.integridadePele.trim()) {
    partes.push(`Integridade da pele: ${e.integridadePele.trim()}`)
  }
  if (typeof e.mobilidade === 'string' && e.mobilidade.trim()) {
    partes.push(`Mobilidade: ${e.mobilidade.trim()}`)
  }
  if (typeof e.eliminacoes === 'string' && e.eliminacoes.trim()) {
    partes.push(`Eliminações: ${e.eliminacoes.trim()}`)
  }
  if (typeof e.observacoes === 'string' && e.observacoes.trim()) {
    partes.push(`Observações: ${e.observacoes.trim()}`)
  }
  return partes.join('\n')
}

function montarEvolucoesProntuarioEnfermagem(atendimento: AtendimentoFicha): EvolucaoLinhaFicha[] {
  const linhas: EvolucaoLinhaFicha[] = []

  for (const ficha of atendimento.fichasEvolucaoTurno ?? []) {
    const dataRef = ficha.dataReferencia
    const horaRef = ficha.registradoEm ?? dataRef
    linhas.push({
      data: format(dataRef, 'yyyy-MM-dd'),
      hora: format(horaRef, 'HH:mm'),
      evolucaoClinica: ficha.evolucaoClinica?.trim() ?? '',
      relatorioEnfermagem: montarRelatorioEnfermagemTurno(ficha),
    })
  }

  for (const ev of atendimento.prontuario?.evolucoes ?? []) {
    const texto = stripHtmlBasico(ev.conteudo)
    if (!texto) continue
    const autor = ev.autor?.nome ? ` (${ev.autor.nome})` : ''
    linhas.push({
      data: format(ev.registradoEm, 'yyyy-MM-dd'),
      hora: format(ev.registradoEm, 'HH:mm'),
      evolucaoClinica: `${texto}${autor}`,
      relatorioEnfermagem: '',
    })
  }

  const multiEnf = montarRelatorioMultidisciplinarEnfermagem(
    atendimento.fichaMultidisciplinar?.enfermagem
  )
  if (multiEnf) {
    if (linhas.length > 0) {
      const ultima = linhas[linhas.length - 1]
      ultima.relatorioEnfermagem = [ultima.relatorioEnfermagem, multiEnf]
        .filter(Boolean)
        .join('\n\n')
    } else {
      linhas.push({
        data: format(new Date(), 'yyyy-MM-dd'),
        hora: format(new Date(), 'HH:mm'),
        evolucaoClinica: '',
        relatorioEnfermagem: multiEnf,
      })
    }
  }

  if (!linhas.length) return [EVOLUCAO_LINHA_VAZIA()]
  return linhas
}

function montarDiagnosticoDefinitivoSugerido(atendimento: AtendimentoFicha): string {
  const diag =
    atendimento.prontuario?.diagnosticos.find((d) => d.principal) ??
    atendimento.prontuario?.diagnosticos[0]
  if (!diag) return ''
  return `${diag.codigoCid} — ${diag.descricaoCid}`
}

function montarMedicoCremepe(atendimento: AtendimentoFicha): string {
  if (!atendimento.medico) return ''
  return `${atendimento.medico.nome}${atendimento.medico.crm ? ` — CRM ${atendimento.medico.crm}` : ''}`
}

function montarPosInternacaoDoProntuario(
  atendimento: AtendimentoFicha
): ReturnType<typeof camposPosInternacaoVazios> {
  return {
    ...camposPosInternacaoVazios(),
    evolucoes: montarEvolucoesProntuarioEnfermagem(atendimento),
    diagnosticoDefinitivo: montarDiagnosticoDefinitivoSugerido(atendimento),
    medicoCremepeAlta: montarMedicoCremepe(atendimento),
  }
}

function montarPressaoArterial(
  sv: NonNullable<NonNullable<AtendimentoFicha['triagem']>['sinaisVitais']>
): string {
  if (sv.paSistolica != null && sv.paDiastolica != null) {
    return `${sv.paSistolica}/${sv.paDiastolica} mmHg`
  }
  return ''
}

function fichaSalvaParaPrefill(ficha: FichaInternacaoAlta): FichaInternacaoAltaPrefill {
  const dados = (ficha.dadosFormulario ?? {}) as Partial<FichaInternacaoAltaForm>
  return {
    status: ficha.status as FichaInternacaoAltaForm['status'],
    registroNumero: dados.registroNumero ?? ficha.numeroProntuario ?? '',
    dataInternacao: dados.dataInternacao ?? '',
    horaInternacao: dados.horaInternacao ?? '',
    unidadeSaude: dados.unidadeSaude ?? '',
    nome: dados.nome ?? ficha.nomePaciente ?? '',
    categoria: dados.categoria ?? '',
    sexo: dados.sexo ?? '',
    idade: dados.idade ?? '',
    cor: dados.cor ?? '',
    estadoCivil: dados.estadoCivil ?? '',
    naturalidade: dados.naturalidade ?? '',
    profissao: dados.profissao ?? '',
    endereco: dados.endereco ?? '',
    procedencia: dados.procedencia ?? '',
    responsavelPessoaDependente: dados.responsavelPessoaDependente ?? '',
    responsavelParentesco: dados.responsavelParentesco ?? '',
    responsavelEndereco: dados.responsavelEndereco ?? '',
    responsavelFone: dados.responsavelFone ?? '',
    trazidoPor: dados.trazidoPor ?? '',
    trazidoEndereco: dados.trazidoEndereco ?? '',
    trazidoFone: dados.trazidoFone ?? '',
    localAcidente: dados.localAcidente ?? '',
    dataAcidente: dados.dataAcidente ?? '',
    horaAcidente: dados.horaAcidente ?? '',
    naturezaAcidente: dados.naturezaAcidente ?? {},
    atendimentoClinico: dados.atendimentoClinico ?? false,
    atendimentoCirurgico: dados.atendimentoCirurgico ?? false,
    historiaDoencaAtual: dados.historiaDoencaAtual ?? '',
    pressaoArterial: dados.pressaoArterial ?? '',
    pulso: dados.pulso ?? '',
    temperatura: dados.temperatura ?? '',
    peso: dados.peso ?? '',
    exameFisico: dados.exameFisico ?? '',
    diagnosticoProvisorio: dados.diagnosticoProvisorio ?? '',
    recepcionista: dados.recepcionista ?? '',
    medicoCremepe: dados.medicoCremepe ?? '',
    observacoesEnfermagem: dados.observacoesEnfermagem ?? '',
    evolucoes: dados.evolucoes?.length ? dados.evolucoes : [EVOLUCAO_LINHA_VAZIA()],
    altaCurado: dados.altaCurado ?? false,
    altaMelhorado: dados.altaMelhorado ?? false,
    altaInternado: dados.altaInternado ?? false,
    altaPiorado: dados.altaPiorado ?? false,
    obito: dados.obito ?? false,
    obitoData: dados.obitoData ?? '',
    obitoHora: dados.obitoHora ?? '',
    obitoMais48h: dados.obitoMais48h ?? false,
    obitoMenos48h: dados.obitoMenos48h ?? false,
    motivoDecisaoMedica: dados.motivoDecisaoMedica ?? false,
    motivoAltaPedida: dados.motivoAltaPedida ?? false,
    motivoTransferencia: dados.motivoTransferencia ?? false,
    motivoIndisciplina: dados.motivoIndisciplina ?? false,
    transferenciaPara: dados.transferenciaPara ?? '',
    diagnosticoDefinitivo: dados.diagnosticoDefinitivo ?? '',
    observacaoAlta: dados.observacaoAlta ?? '',
    dataAlta: dados.dataAlta ?? '',
    medicoCremepeAlta: dados.medicoCremepeAlta ?? '',
  }
}

export function montarPrefillFichaInternacaoAlta(
  atendimento: AtendimentoFicha,
  instituicao: InstituicaoDados,
  fichaExistente: FichaInternacaoAlta | null,
  usuario: { nome: string }
): FichaInternacaoAltaPrefill {
  const p = atendimento.paciente
  const sv = atendimento.triagem?.sinaisVitais
  const enc = atendimento.prontuario?.encaminhamentos.find((e) => true)
  const agora = new Date()

  const base: FichaInternacaoAltaPrefill = {
    status: 'RASCUNHO',
    registroNumero: atendimento.numeroAtendimento,
    dataInternacao: format(agora, 'yyyy-MM-dd'),
    horaInternacao: format(agora, 'HH:mm'),
    unidadeSaude: instituicao?.nomeInstituicao ?? atendimento.setor ?? '',
    nome: obterNomeCompletoPaciente(p.nomeExibicao, p.nomeCriptografado),
    categoria: p.convenio?.trim() || 'SUS',
    sexo: sexoLabel(p.sexoBiologico),
    idade: String(differenceInYears(agora, p.dataNascimento)),
    cor: p.racaCor ?? '',
    estadoCivil: '',
    naturalidade: p.naturalidade ?? '',
    profissao: p.profissao ?? '',
    endereco: p.endereco ? montarEndereco(p.endereco) : '',
    procedencia:
      atendimento.origem?.procedenciaFicha?.trim() ||
      atendimento.origem?.descricao?.trim() ||
      '',
    responsavelPessoaDependente: p.nomeMae ?? '',
    responsavelParentesco: p.nomeMae ? 'Mãe' : '',
    responsavelEndereco: p.endereco ? montarEndereco(p.endereco) : '',
    responsavelFone: telefoneTexto(p.telefoneCriptografado),
    trazidoPor: p.acompanhanteNome ?? '',
    trazidoEndereco: '',
    trazidoFone: p.acompanhanteTelefone ?? '',
    localAcidente: '',
    dataAcidente: '',
    horaAcidente: '',
    naturezaAcidente: {
      casual: false,
      queda: false,
      acidenteTrabalho: false,
      acidenteTransito: false,
      intoxicacao: false,
      agressao: false,
      tentativaSuicidio: false,
      outrasCausas: false,
      outrasCausasTexto: '',
    },
    atendimentoClinico: enc?.especialidade?.toLowerCase().includes('cirurg') ? false : true,
    atendimentoCirurgico: enc?.especialidade?.toLowerCase().includes('cirurg') ?? false,
    historiaDoencaAtual:
      atendimento.prontuario?.anamnese?.hda?.trim() ||
      atendimento.triagem?.queixaPrincipal ||
      enc?.resumoClinco?.trim() ||
      '',
    pressaoArterial: sv ? montarPressaoArterial(sv) : '',
    pulso: sv?.frequenciaCardiaca != null ? String(sv.frequenciaCardiaca) : '',
    temperatura: sv?.temperatura != null ? String(sv.temperatura) : '',
    peso: sv?.peso != null ? String(sv.peso) : '',
    exameFisico: exameFisicoParaTexto(atendimento.prontuario?.anamnese?.exameFisico),
    diagnosticoProvisorio: montarDiagnosticoProvisorio(atendimento),
    recepcionista: usuario.nome,
    medicoCremepe: atendimento.medico
      ? `${atendimento.medico.nome}${atendimento.medico.crm ? ` — CRM ${atendimento.medico.crm}` : ''}`
      : '',
    observacoesEnfermagem: '',
    ...camposPosInternacaoVazios(),
  }

  const internado = atendimento.status === 'INTERNADO'

  if (internado) {
    Object.assign(base, montarPosInternacaoDoProntuario(atendimento))
  }

  if (fichaExistente) {
    const salvo = fichaSalvaParaPrefill(fichaExistente)
    const salvoMesclavel = internado ? salvo : { ...salvo, ...camposPosInternacaoVazios() }
    const merged = mesclarPrefill(base, salvoMesclavel)

    if (internado && !evolucoesTemConteudo(salvo.evolucoes)) {
      merged.evolucoes = montarEvolucoesProntuarioEnfermagem(atendimento)
    }

    return merged
  }

  return base
}

export function dadosFichaInternacaoAltaParaPrisma(
  dados: FichaInternacaoAltaForm,
  preenchidoPorId?: string
): Omit<Prisma.FichaInternacaoAltaUncheckedCreateInput, 'atendimentoId'> {
  const { status, nome, registroNumero, ...resto } = dados
  return {
    status,
    nomePaciente: nome,
    numeroProntuario: registroNumero || null,
    dadosFormulario: { ...resto, nome, registroNumero } as Prisma.InputJsonValue,
    preenchidoPorId: preenchidoPorId ?? null,
  }
}
