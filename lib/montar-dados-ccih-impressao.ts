// lib/montar-dados-ccih-impressao.ts

import { format } from 'date-fns'
import { includeAtendimentoInternacao, type AtendimentoInternacaoCtx } from '@/lib/prefill-internamento'
import { prisma } from '@/lib/prisma'
import { montarPrefillFichaCcih, LABEL_STATUS_FICHA_CCIH, LABEL_INFECCAO_OPCAO } from '@/lib/ccih-internacao'
import type { FichaCcihForm, FormularioCcihNotificacao } from '@/lib/validations/ccih'

function fmtData(d: Date | string | null | undefined): string {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d.includes('T') ? d : `${d}T12:00:00`) : d
  if (Number.isNaN(dt.getTime())) return typeof d === 'string' ? d : ''
  return format(dt, 'dd/MM/yyyy')
}

function checksMarcados(
  obj: Record<string, unknown> | undefined,
  labels: Record<string, string>
): string {
  if (!obj) return '—'
  const itens = Object.entries(labels)
    .filter(([k]) => Boolean(obj[k]))
    .map(([, label]) => label)
  return itens.length ? itens.join('; ') : 'Nenhum'
}

const LABEL_PROCEDIMENTOS: Record<string, string> = {
  assistencia_ventilatoria: 'Assistência ventilatória',
  disseccao_venosa: 'Dissecção venosa',
  puncao_lombar: 'Punção lombar',
  biopsia: 'Biópsia',
  entubacao: 'Entubação',
  puncao_toracica: 'Punção torácica',
  cateterismo_vesical: 'Cateterismo vesical',
  npt: 'NPT',
  hemotransfusao: 'Hemotransfusão',
  cateterismo_venoso: 'Cateterismo venoso',
  nebulizacao: 'Nebulização',
  traqueostomia: 'Traqueostomia',
  puncao_venosa: 'Punção venosa',
  puncao_abdominal: 'Punção abdominal',
}

const LABEL_TOPOGRAFIAS: Record<string, string> = {
  coto_umbilical: 'Coto umbilical',
  ocular: 'Ocular',
  puerperal: 'Puerperal',
  cutanea_nao_cirurgica: 'Cutânea não cirúrgica',
  ouvido: 'Ouvido',
  respiratoria: 'Respiratória',
  ferida_cirurgica: 'Ferida cirúrgica',
  oral: 'Oral',
  urinaria: 'Urinária',
  gastro_intestinal: 'Gastrointestinal',
  peritonial: 'Peritoneal',
  venosa_flebite: 'Venosa / flebite',
}

export type FichaCcihImpressaoDados = {
  instituicao: {
    nomeMunicipio: string
    nomeInstituicao: string
    logomarcaUrl: string | null
    cnes?: string | null
    codigoIbgeMunicipio?: string | null
  }
  status: string
  numeroAtendimento: string
  diasInternacao: string
  formulario: FormularioCcihNotificacao
  procedimentosRisco: string
  infeccaoOpcao: string
  topografias: string
  medicamentos: string
  observacoesEquipe: string
  parecerCcih: string
}

function formParaImpressao(
  form: FichaCcihForm & { numeroAtendimento?: string; diasInternacao?: number | null },
  inst: { nomeInstituicao?: string | null; nomeMunicipio?: string | null; logomarcaUrl?: string | null; cnes?: string | null; codigoIbgeMunicipio?: string | null } | null
): FichaCcihImpressaoDados {
  const f = form.formulario
  const proc = f.procedimentos_risco_realizados ?? {}
  const procTexto = checksMarcados(proc as Record<string, unknown>, LABEL_PROCEDIMENTOS)
  const complemento = proc.procedimento_complemento_texto?.trim()
  const outrosProc = proc.outros_procedimentos_texto?.trim()
  let procedimentosRisco = procTexto
  if (complemento) {
    procedimentosRisco += `${procedimentosRisco !== 'Nenhum' ? '\n' : ''}Complemento: ${complemento}`
  }
  if (outrosProc) {
    procedimentosRisco += `${procedimentosRisco !== 'Nenhum' ? '\n' : ''}Outros: ${outrosProc}`
  }

  const opcaoInf = f.infeccao_notificada?.infeccao_opcao
  const infeccaoOpcao = opcaoInf ? (LABEL_INFECCAO_OPCAO[opcaoInf] ?? opcaoInf) : '—'

  const topo = f.infeccao_notificada?.localizacao_topografica ?? {}
  const topoTexto = checksMarcados(topo as Record<string, unknown>, LABEL_TOPOGRAFIAS)
  const outrasTopo = topo.outras_topografias_texto?.trim()
  const topografias = outrasTopo ? `${topoTexto}${topoTexto !== 'Nenhum' ? '; ' : ''}Outras: ${outrasTopo}` : topoTexto

  const meds = (f.uso_antimicrobianos?.medicamentos ?? [])
    .filter((m) => (m.tipo_nome ?? m.nome_antimicrobiano)?.trim())
    .map((m) => {
      const nome = m.tipo_nome ?? m.nome_antimicrobiano ?? ''
      const dose = m.dose ?? m.dose_posologia ?? ''
      return [nome, dose, m.data_inicio ? `início ${fmtData(m.data_inicio)}` : '', m.data_termino ? `término ${fmtData(m.data_termino)}` : '']
        .filter(Boolean)
        .join(' — ')
    })
    .join('\n')

  return {
    instituicao: {
      nomeMunicipio: inst?.nomeMunicipio ?? '',
      nomeInstituicao: inst?.nomeInstituicao ?? f.hospital ?? '',
      logomarcaUrl: inst?.logomarcaUrl ?? null,
      cnes: inst?.cnes ?? null,
      codigoIbgeMunicipio: inst?.codigoIbgeMunicipio ?? null,
    },
    status: LABEL_STATUS_FICHA_CCIH[form.status] ?? form.status,
    numeroAtendimento: form.numeroAtendimento ?? '',
    diasInternacao: form.diasInternacao != null ? `${form.diasInternacao} dia(s)` : '—',
    formulario: f,
    procedimentosRisco,
    infeccaoOpcao,
    topografias,
    medicamentos: meds || '—',
    observacoesEquipe: form.observacoesEquipe ?? '',
    parecerCcih: form.parecerCcih ?? '',
  }
}

const includeAtendimento = {
  ...includeAtendimentoInternacao,
  fichaCcih: true,
}

export async function montarDadosFichaCcihImpressao(
  atendimentoId: string,
  usuario: { nome: string; crm?: string | null; role: string }
): Promise<FichaCcihImpressaoDados | null> {
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
      codigoIbgeMunicipio: true,
    },
  })

  const prefill = montarPrefillFichaCcih(
    atendimento as AtendimentoInternacaoCtx,
    atendimento.fichaCcih,
    usuario,
    inst
  )
  return formParaImpressao(prefill, inst)
}
