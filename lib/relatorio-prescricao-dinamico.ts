import { formatarDosePrescricao, labelVia } from '@/lib/prescricao-ui'
import { normalizarTipoItemPrescricao } from '@/lib/prescricao-medica-padrao-map'

const ABREV_VIA: Record<string, string> = {
  ORAL: 'VO',
  INTRAVENOSA: 'EV',
  INTRAMUSCULAR: 'IM',
  SUBCUTANEA: 'SC',
  SUBLINGUAL: 'SL',
  TOPICA: 'TOP',
  INALATORIA: 'INH',
  RETAL: 'RET',
  OFTALMICA: 'OFT',
  OTOLOGICA: 'OTO',
  NASAL: 'NAS',
}

export const abreviarViaPrescricao = (via: string) => ABREV_VIA[via] ?? labelVia(via)

/** Linha legível para pré-visualização clínica do modelo */
export type ItemPrescricaoVisualizacao = {
  id: string
  ordem: number
  tipoItem: 'MEDICAMENTO' | 'TEXTO_LIVRE' | 'LINHA_DUPLA'
  medicamento: string
  dose: string
  via: string
  frequencia: string
  duracao: string
  observacoes: string
  textoColunaDireita?: string
}

type ItemModeloDb = {
  ordem: number
  tipoItem?: string | null
  nomeMedicamento: string
  dose: string
  unidadeMedida?: string | null
  via: string
  frequencia: string
  duracaoDias?: number | null
  observacoes?: string | null
}

/** Converte itens do cadastro para exibição clínica (pré-visualização / impressão) */
export const mapItensModeloParaVisualizacao = (
  itens: ItemModeloDb[]
): ItemPrescricaoVisualizacao[] =>
  [...itens]
    .sort((a, b) => a.ordem - b.ordem)
    .map((item, index) => {
      const tipoItem = normalizarTipoItemPrescricao(item.tipoItem)

      if (tipoItem === 'LINHA_DUPLA') {
        return {
          id: String(index + 1),
          ordem: index + 1,
          tipoItem: 'LINHA_DUPLA' as const,
          medicamento: item.nomeMedicamento.trim(),
          dose: '—',
          via: '—',
          frequencia: '—',
          duracao: '—',
          observacoes: '—',
          textoColunaDireita: item.observacoes?.trim() || '',
        }
      }

      if (tipoItem === 'TEXTO_LIVRE') {
        return {
          id: String(index + 1),
          ordem: index + 1,
          tipoItem: 'TEXTO_LIVRE' as const,
          medicamento: item.nomeMedicamento.trim(),
          dose: '—',
          via: '—',
          frequencia: '—',
          duracao: '—',
          observacoes: '—',
        }
      }

      return {
        id: String(index + 1),
        ordem: index + 1,
        tipoItem: 'MEDICAMENTO' as const,
        medicamento: item.nomeMedicamento.trim(),
        dose: formatarDosePrescricao(item.dose, item.unidadeMedida) || '—',
        via: abreviarViaPrescricao(item.via),
        frequencia: item.frequencia?.trim() || '—',
        duracao: item.duracaoDias ? `${item.duracaoDias} dia(s)` : 'Contínuo',
        observacoes: item.observacoes?.trim() || '—',
      }
    })
