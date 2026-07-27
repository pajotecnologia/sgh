// lib/montar-dados-multidisciplinar-impressao.ts

import { format } from 'date-fns'
import { includeAtendimentoInternacao, type AtendimentoInternacaoCtx } from '@/lib/prefill-internamento'
import { prisma } from '@/lib/prisma'
import {
  montarPrefillFichaMultidisciplinar,
  LABEL_STATUS_FICHA_MULTIDISCIPLINAR,
} from '@/lib/multidisciplinar-internacao'
import type { FichaMultidisciplinarForm } from '@/lib/validations/multidisciplinar'

function fmtData(d: Date | string | null | undefined): string {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d.includes('T') ? d : `${d}T12:00:00`) : d
  if (Number.isNaN(dt.getTime())) return typeof d === 'string' ? d : ''
  return format(dt, 'dd/MM/yyyy')
}

function blocoSecao(titulo: string, campos: { rotulo: string; valor: string }[]): string {
  const linhas = campos
    .filter((c) => c.valor?.trim())
    .map((c) => `${c.rotulo}: ${c.valor.trim()}`)
  if (!linhas.length) return ''
  return `【${titulo}】\n${linhas.join('\n')}`
}

function secaoGenerica(
  titulo: string,
  s: Record<string, unknown> | undefined,
  mapa: { key: string; rotulo: string }[]
): string {
  if (!s) return ''
  return blocoSecao(
    titulo,
    mapa.map(({ key, rotulo }) => ({
      rotulo,
      valor:
        key.includes('data') && s[key]
          ? fmtData(String(s[key]))
          : String(s[key] ?? ''),
    }))
  )
}

export type FichaMultidisciplinarImpressaoDados = {
  instituicao: {
    nomeMunicipio: string
    nomeInstituicao: string
    logomarcaUrl: string | null
    cnes?: string | null
  }
  status: string
  numeroAtendimento: string
  nomePaciente: string
  numeroProntuario: string
  dataNascimento: string
  sexo: string
  setorUnidade: string
  leitoDescricao: string
  dataInternacao: string
  diasInternacao: string
  diagnosticoPrincipal: string
  cidPrincipal: string
  textoMedico: string
  textoEnfermagem: string
  textoNutricao: string
  textoFisioterapia: string
  textoPsicologia: string
  textoFarmacia: string
  textoPlanoConjunto: string
}

function formParaImpressao(
  form: FichaMultidisciplinarForm & { numeroAtendimento?: string; diasInternacao?: number | null },
  inst: {
    nomeInstituicao?: string | null
    nomeMunicipio?: string | null
    logomarcaUrl?: string | null
    cnes?: string | null
  } | null
): FichaMultidisciplinarImpressaoDados {
  const sexoLabel =
    form.sexo === 'MASCULINO'
      ? 'Masculino'
      : form.sexo === 'FEMININO'
        ? 'Feminino'
        : form.sexo === 'INTERSEXO'
          ? 'Intersexo'
          : 'Não informado'

  const med = form.medico as Record<string, unknown> | undefined
  const enf = form.enfermagem as Record<string, unknown> | undefined
  const nut = form.nutricao as Record<string, unknown> | undefined
  const fis = form.fisioterapia as Record<string, unknown> | undefined
  const psi = form.psicologia as Record<string, unknown> | undefined
  const far = form.farmacia as Record<string, unknown> | undefined
  const plano = form.planoConjunto as Record<string, unknown> | undefined

  return {
    instituicao: {
      nomeMunicipio: inst?.nomeMunicipio ?? '',
      nomeInstituicao: inst?.nomeInstituicao ?? '',
      logomarcaUrl: inst?.logomarcaUrl ?? null,
      cnes: inst?.cnes ?? null,
    },
    status: LABEL_STATUS_FICHA_MULTIDISCIPLINAR[form.status] ?? form.status,
    numeroAtendimento: form.numeroAtendimento ?? '',
    nomePaciente: form.nomePaciente,
    numeroProntuario: form.numeroProntuario ?? '',
    dataNascimento: fmtData(form.dataNascimento),
    sexo: sexoLabel,
    setorUnidade: form.setorUnidade ?? '',
    leitoDescricao: form.leitoDescricao ?? '',
    dataInternacao: fmtData(form.dataInternacao),
    diasInternacao:
      form.diasInternacao != null ? `${form.diasInternacao} dia(s)` : '—',
    diagnosticoPrincipal: form.diagnosticoPrincipal ?? '',
    cidPrincipal: form.cidPrincipal ?? '',
    textoMedico: secaoGenerica('Médico', med, [
      { key: 'resumoClinico', rotulo: 'Resumo clínico' },
      { key: 'conduta', rotulo: 'Conduta' },
      { key: 'prognostico', rotulo: 'Prognóstico' },
      { key: 'observacoes', rotulo: 'Observações' },
      { key: 'nomeProfissional', rotulo: 'Profissional' },
      { key: 'conselho', rotulo: 'Conselho' },
      { key: 'dataAvaliacao', rotulo: 'Data' },
    ]),
    textoEnfermagem: secaoGenerica('Enfermagem', enf, [
      { key: 'diagnosticoEnfermagem', rotulo: 'Diagnóstico de enfermagem' },
      { key: 'intervencoes', rotulo: 'Intervenções' },
      { key: 'integridadePele', rotulo: 'Integridade da pele' },
      { key: 'mobilidade', rotulo: 'Mobilidade' },
      { key: 'eliminacoes', rotulo: 'Eliminações' },
      { key: 'escalaBraden', rotulo: 'Escala de Braden' },
      { key: 'observacoes', rotulo: 'Observações' },
      { key: 'nomeProfissional', rotulo: 'Profissional' },
      { key: 'conselho', rotulo: 'Conselho' },
      { key: 'dataAvaliacao', rotulo: 'Data' },
    ]),
    textoNutricao: secaoGenerica('Nutrição', nut, [
      { key: 'riscoNutricional', rotulo: 'Risco nutricional' },
      { key: 'dietaAtual', rotulo: 'Dieta atual' },
      { key: 'restricoes', rotulo: 'Restrições' },
      { key: 'condutaMetas', rotulo: 'Conduta / metas' },
      { key: 'observacoes', rotulo: 'Observações' },
      { key: 'nomeProfissional', rotulo: 'Profissional' },
      { key: 'conselho', rotulo: 'Conselho' },
      { key: 'dataAvaliacao', rotulo: 'Data' },
    ]),
    textoFisioterapia: secaoGenerica('Fisioterapia', fis, [
      { key: 'avaliacaoFuncional', rotulo: 'Avaliação funcional' },
      { key: 'condutaMetas', rotulo: 'Conduta / metas' },
      { key: 'observacoes', rotulo: 'Observações' },
      { key: 'nomeProfissional', rotulo: 'Profissional' },
      { key: 'conselho', rotulo: 'Conselho' },
      { key: 'dataAvaliacao', rotulo: 'Data' },
    ]),
    textoPsicologia: secaoGenerica('Psicologia / Serviço social', psi, [
      { key: 'aspectosPsicossociais', rotulo: 'Aspectos psicossociais' },
      { key: 'redeApoio', rotulo: 'Rede de apoio' },
      { key: 'condutaOrientacoes', rotulo: 'Conduta / orientações' },
      { key: 'observacoes', rotulo: 'Observações' },
      { key: 'nomeProfissional', rotulo: 'Profissional' },
      { key: 'conselho', rotulo: 'Conselho' },
      { key: 'dataAvaliacao', rotulo: 'Data' },
    ]),
    textoFarmacia: secaoGenerica('Farmácia clínica', far, [
      { key: 'reconciliacaoMedicamentosa', rotulo: 'Reconciliação medicamentosa' },
      { key: 'interacoesAlertas', rotulo: 'Interações / alertas' },
      { key: 'orientacoes', rotulo: 'Orientações' },
      { key: 'observacoes', rotulo: 'Observações' },
      { key: 'nomeProfissional', rotulo: 'Profissional' },
      { key: 'conselho', rotulo: 'Conselho' },
      { key: 'dataAvaliacao', rotulo: 'Data' },
    ]),
    textoPlanoConjunto: secaoGenerica('Plano conjunto da equipe', plano, [
      { key: 'dataReuniao', rotulo: 'Data da reunião' },
      { key: 'metasEquipe', rotulo: 'Metas da equipe' },
      { key: 'encaminhamentos', rotulo: 'Encaminhamentos' },
      { key: 'dataProximaRevisao', rotulo: 'Próxima revisão' },
      { key: 'observacoesGerais', rotulo: 'Observações gerais' },
    ]),
  }
}

const includeAtendimento = {
  ...includeAtendimentoInternacao,
  fichaMultidisciplinar: true,
}

export async function montarDadosFichaMultidisciplinarImpressao(
  atendimentoId: string,
  usuario: { nome: string; crm?: string | null; role: string }
): Promise<FichaMultidisciplinarImpressaoDados | null> {
  const atendimento = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, deletedAt: null, status: 'INTERNADO' },
    include: includeAtendimento,
  })

  if (!atendimento) return null

  const inst = await prisma.instituicao.findFirst({
    select: {
      nomeInstituicao: true,
      nomeMunicipio: true,
      logomarcaUrl: true,
      cnes: true,
    },
  })

  const prefill = montarPrefillFichaMultidisciplinar(
    atendimento as AtendimentoInternacaoCtx,
    atendimento.fichaMultidisciplinar,
    usuario
  )

  return formParaImpressao(prefill, inst)
}
