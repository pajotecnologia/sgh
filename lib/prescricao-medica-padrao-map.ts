import type { CriarPrescricaoForm } from '@/lib/validations/atendimento'
import type { ItemPrescricaoMedicaPadraoForm, TipoItemPrescricaoMedica } from '@/lib/validations/prescricao-medica-padrao'
import { VIAS_ADMINISTRACAO } from '@/lib/prescricao-ui'

type ItemPadraoDb = {
  ordem: number
  tipoItem?: string | null
  nomeMedicamento: string
  principioAtivo?: string | null
  dose: string
  unidadeMedida?: string | null
  via: string
  frequencia: string
  quantidadeSolicitada: number
  duracaoDias?: number | null
  observacoes?: string | null
}

type ViaPrescricao = CriarPrescricaoForm['itens'][number]['via']

const viasValidas = new Set<string>(VIAS_ADMINISTRACAO)

const normalizarVia = (via: string): ViaPrescricao =>
  viasValidas.has(via) ? (via as ViaPrescricao) : 'ORAL'

export const MARCADOR_DOSE_LINHA_DUPLA = 'LINHA_DUPLA'

export const normalizarTipoItemPrescricao = (
  tipo?: string | null
): TipoItemPrescricaoMedica => {
  if (tipo === 'LINHA_DUPLA') return 'LINHA_DUPLA'
  if (tipo === 'TEXTO_LIVRE') return 'TEXTO_LIVRE'
  return 'MEDICAMENTO'
}

export const isLinhaDuplaPrescricao = (
  item: { dose?: string | null; tipoItem?: string | null }
): boolean =>
  item.tipoItem === 'LINHA_DUPLA' || item.dose === MARCADOR_DOSE_LINHA_DUPLA

export const itemDbParaPrescricaoMedicaPadraoForm = (
  item: ItemPadraoDb
): ItemPrescricaoMedicaPadraoForm => {
  const tipoItem = normalizarTipoItemPrescricao(item.tipoItem)

  if (tipoItem === 'LINHA_DUPLA') {
    return {
      tipoItem: 'LINHA_DUPLA',
      nomeMedicamento: item.nomeMedicamento,
      observacoes: item.observacoes?.trim() ?? '',
      principioAtivo: '',
      dose: '',
      unidadeMedida: '',
      via: '',
      frequencia: '',
    }
  }

  if (tipoItem === 'TEXTO_LIVRE') {
    return {
      tipoItem: 'TEXTO_LIVRE',
      nomeMedicamento: item.nomeMedicamento,
      principioAtivo: '',
      dose: '',
      unidadeMedida: '',
      via: '',
      frequencia: '',
      observacoes: '',
    }
  }

  return {
    tipoItem: 'MEDICAMENTO',
    nomeMedicamento: item.nomeMedicamento,
    principioAtivo: item.principioAtivo?.trim() ?? '',
    dose: item.dose,
    unidadeMedida: item.unidadeMedida ?? '',
    via: normalizarVia(item.via),
    frequencia: item.frequencia,
    quantidadeSolicitada: item.quantidadeSolicitada ?? 1,
    duracaoDias: item.duracaoDias ?? undefined,
    observacoes: item.observacoes?.trim() ?? '',
  }
}

export const itemPrescricaoMedicaPadraoParaDb = (
  item: ItemPrescricaoMedicaPadraoForm,
  ordem: number
) => {
  if (item.tipoItem === 'LINHA_DUPLA') {
    return {
      ordem,
      tipoItem: 'LINHA_DUPLA',
      nomeMedicamento: item.nomeMedicamento.trim(),
      principioAtivo: null,
      dose: MARCADOR_DOSE_LINHA_DUPLA,
      unidadeMedida: null,
      via: 'ORAL',
      frequencia: '—',
      quantidadeSolicitada: 1,
      duracaoDias: null,
      observacoes: item.observacoes?.trim() || null,
    }
  }

  if (item.tipoItem === 'TEXTO_LIVRE') {
    return {
      ordem,
      tipoItem: 'TEXTO_LIVRE',
      nomeMedicamento: item.nomeMedicamento.trim(),
      principioAtivo: null,
      dose: '—',
      unidadeMedida: null,
      via: 'ORAL',
      frequencia: 'Conforme orientação',
      quantidadeSolicitada: 1,
      duracaoDias: null,
      observacoes: null,
    }
  }

  return {
    ordem,
    tipoItem: 'MEDICAMENTO',
    nomeMedicamento: item.nomeMedicamento.trim(),
    principioAtivo: item.principioAtivo?.trim() || null,
    dose: item.dose.trim(),
    unidadeMedida: item.unidadeMedida?.trim() || null,
    via: item.via,
    frequencia: item.frequencia.trim(),
    quantidadeSolicitada: item.quantidadeSolicitada ?? 1,
    duracaoDias: item.duracaoDias ?? null,
    observacoes: item.observacoes?.trim() || null,
  }
}

export const mapItensPrescricaoMedicaPadraoParaForm = (
  itens: ItemPadraoDb[]
): CriarPrescricaoForm['itens'] =>
  [...itens]
    .sort((a, b) => a.ordem - b.ordem)
    .filter((item) => item.nomeMedicamento?.trim())
    .map((item) => {
      const tipoItem = normalizarTipoItemPrescricao(item.tipoItem)

      if (tipoItem === 'LINHA_DUPLA') {
        const obs = item.observacoes?.trim() ?? ''
        return {
          nomeMedicamento: item.nomeMedicamento.trim(),
          principioAtivo: '',
          dose: obs || '—',
          unidadeMedida: '',
          via: 'ORAL' as ViaPrescricao,
          frequencia: obs || 'Conforme prescrição',
          quantidadeSolicitada: 1,
          observacoes: obs,
        }
      }

      if (tipoItem === 'TEXTO_LIVRE') {
        return {
          nomeMedicamento: item.nomeMedicamento.trim(),
          principioAtivo: '',
          dose: '—',
          unidadeMedida: '',
          via: 'ORAL' as ViaPrescricao,
          frequencia: 'Conforme orientação',
          quantidadeSolicitada: 1,
          observacoes: '',
        }
      }

      return {
        nomeMedicamento: item.nomeMedicamento.trim(),
        principioAtivo: item.principioAtivo?.trim() ?? '',
        dose: item.dose.trim(),
        unidadeMedida: item.unidadeMedida?.trim() ?? '',
        via: normalizarVia(item.via),
        frequencia: item.frequencia.trim(),
        quantidadeSolicitada: item.quantidadeSolicitada ?? 1,
        duracaoDias: item.duracaoDias ?? undefined,
        observacoes: item.observacoes?.trim() ?? '',
      }
    })
