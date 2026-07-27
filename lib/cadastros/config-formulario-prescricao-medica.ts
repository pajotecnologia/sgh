import { labelVia, UNIDADES_MEDIDA, VIAS_ADMINISTRACAO } from '@/lib/prescricao-ui'

/** Configuração JSON de um campo do formulário dinâmico */
export type TipoCampoFormularioDinamico =
  | 'texto_curto'
  | 'texto_longo'
  | 'medicacao'
  | 'selecao'

export type OpcaoFormularioDinamico = {
  value: string
  label: string
}

export type CampoFormularioDinamico = {
  chave: string
  rotulo: string
  tipo: TipoCampoFormularioDinamico
  placeholder?: string
  obrigatorio?: boolean
  opcoesMedicacao?: string[]
  opcoes?: OpcaoFormularioDinamico[]
}

export const MEDICAMENTOS_EXEMPLO_PADRAO = [
  'Paracetamol',
  'Ibuprofeno',
  'Amoxicilina',
  'Dipirona',
  'Losartana',
  'Omeprazol',
  'Metformina',
  'Soro fisiológico 0,9%',
] as const

const opcoesUnidade = UNIDADES_MEDIDA.map((u) => ({ value: u.value, label: u.label }))
const opcoesVia = VIAS_ADMINISTRACAO.map((v) => ({ value: v, label: labelVia(v) }))

export const CAMPOS_MODELO_PRESCRICAO_MEDICA: CampoFormularioDinamico[] = [
  {
    chave: 'nome',
    rotulo: 'Nome da prescrição',
    tipo: 'texto_curto',
    placeholder: 'Ex.: Analgesia padrão, Hidratação venosa',
    obrigatorio: true,
  },
  {
    chave: 'descricao',
    rotulo: 'Descrição',
    tipo: 'texto_curto',
    placeholder: 'Quando usar este modelo',
  },
  {
    chave: 'observacoesPadrao',
    rotulo: 'Observações padrão',
    tipo: 'texto_longo',
    placeholder: 'Orientações gerais preenchidas ao selecionar o modelo no prontuário',
  },
]

export const CAMPOS_ITEM_PRESCRICAO_MEDICA: CampoFormularioDinamico[] = [
  {
    chave: 'nomeMedicamento',
    rotulo: 'Medicamento',
    tipo: 'medicacao',
    placeholder: 'Digite livremente ou escolha uma sugestão',
    obrigatorio: true,
  },
  {
    chave: 'dose',
    rotulo: 'Dose',
    tipo: 'texto_curto',
    placeholder: 'Ex.: 500',
    obrigatorio: true,
  },
  {
    chave: 'unidadeMedida',
    rotulo: 'Unidade',
    tipo: 'selecao',
    placeholder: 'Selecione a unidade…',
    opcoes: opcoesUnidade,
    obrigatorio: true,
  },
  {
    chave: 'via',
    rotulo: 'Via',
    tipo: 'selecao',
    placeholder: 'Selecione a via…',
    opcoes: opcoesVia,
    obrigatorio: true,
  },
  {
    chave: 'frequencia',
    rotulo: 'Frequência',
    tipo: 'texto_curto',
    placeholder: 'Ex.: 8/8h, Se dor',
    obrigatorio: true,
  },
  {
    chave: 'duracaoDias',
    rotulo: 'Duração (dias)',
    tipo: 'texto_curto',
    placeholder: 'Deixe vazio para contínuo',
  },
  {
    chave: 'observacoes',
    rotulo: 'Obs. do item',
    tipo: 'texto_longo',
    placeholder: 'Instruções específicas (opcional)',
  },
]
