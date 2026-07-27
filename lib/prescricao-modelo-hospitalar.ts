/** Linhas padrão inspiradas no formulário hospitalar (prescrição médica / enfermagem) */
export const LINHAS_MODELO_HOSPITALAR = [
  'Dieta',
  'Monitorização ou procedimento terapêutico',
  'Exames laboratoriais',
  'Avaliação de risco',
  'Higiene corporal ou de decúbito',
  'Cuidados de dispositivos invasivos',
  'Oxigenoterapia',
  'Ventilação mecânica',
  'Revisão medicamentosa',
  'Avaliação de dor',
  'Deambulação',
  'Educação e comunicação com o paciente',
  'Alimentação',
  'Eliminações',
  'Profilaxia de úlcera de pressão',
  'Profilaxia de tromboembolismo',
  'Controle glicêmico',
  'Controle térmico',
  'Código interno',
  'Código 90',
  'Exames por imagem ou outros',
  'Acessos vasculares',
  'Outros',
  'Medicação profilática',
  'Medicação sintomática',
  'Medicação para condições crônicas',
  'Medicação intravenosa contínua',
  'Medicação intravenosa intermitente',
  'Soluções',
  'Componente especializado de enfermagem',
] as const

export const criarItensLinhaDuplaFromTextos = (textos: readonly string[]) =>
  textos.map((texto) => ({
    tipoItem: 'LINHA_DUPLA' as const,
    nomeMedicamento: texto,
    observacoes: '',
    principioAtivo: '',
    dose: '',
    unidadeMedida: '',
    via: '',
    frequencia: '',
  }))

export const ITENS_MODELO_HOSPITALAR_PADRAO = criarItensLinhaDuplaFromTextos(LINHAS_MODELO_HOSPITALAR)
