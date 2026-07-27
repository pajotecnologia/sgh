import { formatarDosePrescricao, labelVia } from '@/lib/prescricao-ui'
import {
  isLinhaDuplaPrescricao,
  normalizarTipoItemPrescricao,
} from '@/lib/prescricao-medica-padrao-map'
import type { ItemPrescricaoMedicaPadraoForm } from '@/lib/validations/prescricao-medica-padrao'
import type { CriarPrescricaoForm } from '@/lib/validations/atendimento'
import {
  NOME_COLUNA_DIREITA_PADRAO,
  NOME_COLUNA_ESQUERDA_PADRAO,
} from '@/lib/validations/prescricao-medica-padrao'

export type CelulaColunaPrescricao = {
  rotulo: string
  valor: string
}

export type LinhaPrescricaoDuasColunas = {
  id: string
  ordem: number
  tipoItem: 'MEDICAMENTO' | 'TEXTO_LIVRE' | 'LINHA_DUPLA'
  colunaModelo: CelulaColunaPrescricao[]
  colunaMedico: CelulaColunaPrescricao[]
}

export type ColunasPrescricaoModelo = {
  nomeColunaEsquerda: string
  nomeColunaDireita: string
}

type ItemMedicoPrescricao = CriarPrescricaoForm['itens'][number]

export const colunasPrescricaoFromModelo = (modelo?: {
  nomeColunaEsquerda?: string | null
  nomeColunaDireita?: string | null
} | null): ColunasPrescricaoModelo => ({
  nomeColunaEsquerda: modelo?.nomeColunaEsquerda?.trim() || NOME_COLUNA_ESQUERDA_PADRAO,
  nomeColunaDireita: modelo?.nomeColunaDireita?.trim() || NOME_COLUNA_DIREITA_PADRAO,
})

const isTextoLivreItem = (item: ItemPrescricaoMedicaPadraoForm | ItemMedicoPrescricao): boolean => {
  if ('tipoItem' in item && item.tipoItem === 'TEXTO_LIVRE') return true
  return item.dose === '—' || (item.frequencia?.trim() === 'Conforme orientação' && !item.dose?.trim())
}

const celulaTextoSimples = (valor: string): CelulaColunaPrescricao[] =>
  valor.trim() ? [{ rotulo: '', valor: valor.trim() }] : []

const celulasLinhaDuplaModelo = (textoEsquerda: string): CelulaColunaPrescricao[] =>
  celulaTextoSimples(textoEsquerda)

const celulasLinhaDuplaMedicoCadastro = (placeholder?: string): CelulaColunaPrescricao[] => {
  if (placeholder?.trim()) {
    return [{ rotulo: 'Sugestão / exemplo', valor: placeholder.trim() }]
  }
  return [{ rotulo: '', valor: 'Campo em branco — preenchido pelo médico na prescrição' }]
}

const celulasLinhaDuplaMedicoPrescricao = (textoDireita: string): CelulaColunaPrescricao[] =>
  celulaTextoSimples(textoDireita)

const celulasMedicamentoModelo = (
  item: ItemPrescricaoMedicaPadraoForm | ItemMedicoPrescricao
): CelulaColunaPrescricao[] => {
  if (isLinhaDuplaPrescricao(item)) {
    return celulasLinhaDuplaModelo(item.nomeMedicamento)
  }

  if (isTextoLivreItem(item)) {
    return [{ rotulo: 'Texto', valor: item.nomeMedicamento.trim() }]
  }

  const linhas: CelulaColunaPrescricao[] = [
    { rotulo: 'Medicamento', valor: item.nomeMedicamento.trim() },
    {
      rotulo: 'Dose',
      valor: formatarDosePrescricao(item.dose ?? '', item.unidadeMedida) || '—',
    },
    { rotulo: 'Via', valor: labelVia(item.via ?? '') },
    { rotulo: 'Frequência', valor: item.frequencia?.trim() || '—' },
  ]

  if (item.duracaoDias) {
    linhas.push({ rotulo: 'Duração', valor: `${item.duracaoDias} dia(s)` })
  } else {
    linhas.push({ rotulo: 'Duração', valor: 'Contínuo' })
  }

  const obs = item.observacoes?.trim()
  if (obs) linhas.push({ rotulo: 'Observações', valor: obs })

  return linhas
}

const celulasMedicoPreviewCadastro = (
  item: ItemPrescricaoMedicaPadraoForm
): CelulaColunaPrescricao[] => {
  if (item.tipoItem === 'LINHA_DUPLA') {
    return celulasLinhaDuplaMedicoCadastro(item.observacoes)
  }

  if (item.tipoItem === 'TEXTO_LIVRE') {
    return [{ rotulo: '', valor: 'Texto carregado na prescrição; complementar se necessário.' }]
  }

  return [
    { rotulo: '', valor: 'Pré-preenchido com os parâmetros do modelo.' },
    { rotulo: '', valor: 'Dose, via, frequência e duração editáveis na prescrição.' },
  ]
}

const celulasMedicoPrescricao = (item: ItemMedicoPrescricao): CelulaColunaPrescricao[] => {
  if (isLinhaDuplaPrescricao(item)) {
    return celulasLinhaDuplaMedicoPrescricao(item.observacoes ?? '')
  }

  if (isTextoLivreItem(item)) {
    return [{ rotulo: 'Texto / orientação', valor: item.nomeMedicamento.trim() }]
  }

  return celulasMedicamentoModelo(item)
}

export const linhasDuasColunasFromItensModelo = (
  itens: ItemPrescricaoMedicaPadraoForm[]
): LinhaPrescricaoDuasColunas[] =>
  itens.map((item, index) => {
    const tipoItem = normalizarTipoItemPrescricao(item.tipoItem)
    return {
      id: `modelo-${index}-${item.nomeMedicamento}`,
      ordem: index + 1,
      tipoItem,
      colunaModelo: celulasMedicamentoModelo(item),
      colunaMedico: celulasMedicoPreviewCadastro(item),
    }
  })

export const linhasDuasColunasModeloEMedico = (
  referencia: ItemMedicoPrescricao[],
  prescricao: ItemMedicoPrescricao[]
): LinhaPrescricaoDuasColunas[] =>
  prescricao.map((itemMedico, index) => {
    const ref = referencia[index]
    const tipoItem = ref && 'tipoItem' in ref
      ? normalizarTipoItemPrescricao((ref as ItemPrescricaoMedicaPadraoForm).tipoItem)
      : isLinhaDuplaPrescricao(itemMedico)
        ? 'LINHA_DUPLA'
        : isTextoLivreItem(itemMedico)
          ? 'TEXTO_LIVRE'
          : 'MEDICAMENTO'

    return {
      id: `presc-${index}-${itemMedico.nomeMedicamento}`,
      ordem: index + 1,
      tipoItem,
      colunaModelo: ref
        ? celulasMedicamentoModelo(ref)
        : [{ rotulo: '—', valor: 'Sem modelo de referência' }],
      colunaMedico: celulasMedicoPrescricao(itemMedico),
    }
  })

export const linhasDuasColunasFromItensVisualizacao = (
  itens: {
    ordem: number
    tipoItem: 'MEDICAMENTO' | 'TEXTO_LIVRE' | 'LINHA_DUPLA'
    medicamento: string
    dose: string
    via: string
    frequencia: string
    duracao: string
    observacoes: string
    textoColunaDireita?: string
  }[]
): LinhaPrescricaoDuasColunas[] =>
  itens.map((item) => ({
    id: `viz-${item.ordem}`,
    ordem: item.ordem,
    tipoItem: item.tipoItem,
    colunaModelo:
      item.tipoItem === 'LINHA_DUPLA'
        ? celulasLinhaDuplaModelo(item.medicamento)
        : item.tipoItem === 'TEXTO_LIVRE'
          ? [{ rotulo: 'Texto', valor: item.medicamento }]
          : [
              { rotulo: 'Medicamento', valor: item.medicamento },
              { rotulo: 'Dose', valor: item.dose },
              { rotulo: 'Via', valor: item.via },
              { rotulo: 'Frequência', valor: item.frequencia },
              { rotulo: 'Duração', valor: item.duracao },
              ...(item.observacoes !== '—'
                ? [{ rotulo: 'Observações', valor: item.observacoes }]
                : []),
            ],
    colunaMedico:
      item.tipoItem === 'LINHA_DUPLA'
        ? celulasLinhaDuplaMedicoCadastro(item.textoColunaDireita)
        : item.tipoItem === 'TEXTO_LIVRE'
          ? [{ rotulo: '', valor: 'Preenchido na prescrição' }]
          : [
              { rotulo: '', valor: 'Pré-preenchido na prescrição' },
              { rotulo: '', valor: 'Ajustável pelo médico' },
            ],
  }))

export const modeloUsaLinhasDuplas = (itens: ItemPrescricaoMedicaPadraoForm[]): boolean =>
  itens.some((item) => item.tipoItem === 'LINHA_DUPLA')
