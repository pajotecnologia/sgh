// lib/obstetricia-campos.ts — Definições das fichas obstétricas (internação/alta e berçário)

export type CampoSae = { key: string; label: string; tipo?: 'texto' | 'data' | 'hora' | 'area' }
export type SecaoCampos = { titulo: string; campos: CampoSae[] }

const c = (key: string, label: string, tipo: CampoSae['tipo'] = 'texto'): CampoSae => ({ key, label, tipo })

// ===== FOLHA DE INTERNAÇÃO E ALTA EM OBSTETRÍCIA =====
// Layout em linhas: cada linha é um array de campos renderizado em colunas.

export type CampoObst = {
  key: string
  label: string
  tipo?: 'texto' | 'data' | 'hora' | 'area' | 'radio'
  opcoes?: string[]
}
export type SecaoObst = { titulo: string; fonteMenor?: boolean; linhas: CampoObst[][] }

const t = (key: string, label: string, tipo: CampoObst['tipo'] = 'texto'): CampoObst => ({ key, label, tipo })
const radio = (key: string, label: string, opcoes: string[]): CampoObst => ({ key, label, tipo: 'radio', opcoes })

export const SECOES_INTERNACAO_OBSTETRICA: SecaoObst[] = [
  {
    titulo: 'Responsável',
    fonteMenor: true,
    linhas: [
      [t('resp_pessoa', 'Pessoa de quem depende'), t('resp_parentesco', 'Parentesco')],
      [t('resp_endereco', 'Endereço'), t('resp_fone', 'Fone')],
      [t('resp_trazidaPor', 'Trazida por'), t('resp_internadaPor', 'Internada por ordem de')],
    ],
  },
  {
    titulo: 'Atenção médica',
    linhas: [
      [t('am_hora', 'Hora do atendimento médico', 'hora'), t('am_gesta', 'Gesta'), t('am_para', 'Para')],
      [t('am_historia', 'História da doença atual (início - evolução - estado atual)', 'area')],
      [t('am_primeirasDores', 'Primeiras dores em'), t('am_expeliuMuco', 'Expeliu muco sanguinolento')],
      [t('am_examinadaAntes', 'Examinada antes da entrada'), t('am_quemExaminou', 'Quem examinou')],
    ],
  },
  {
    titulo: 'Exame físico',
    linhas: [
      [t('ef_estadoGeral', 'Estado geral'), t('ef_mucosas', 'Mucosas'), t('ef_pulso', 'Pulso'), t('ef_tempo', 'Tempo')],
      [t('ef_pa', 'Pressão arterial'), t('ef_ultimasRegras', 'Últimas regras'), t('ef_hemorragia', 'Hemorragia')],
      [t('ef_edema', 'Edema'), t('ef_vomito', 'Vômito'), t('ef_transtornosVisuais', 'Transtornos visuais'), t('ef_dor', 'Dor')],
      [radio('ef_abortoProvocado', 'Aborto provocado', ['Sim', 'Não']), t('ef_uteroForma', 'Útero: forma'), t('ef_uteroAltura', 'Altura')],
      [t('ef_tono', 'Tono'), t('ef_dilatacaoColo', 'Dilatação do colo'), t('ef_fetoSituacao', 'Feto: situação')],
      [t('ef_apresentacao', 'Apresentação'), t('ef_posicao', 'Posição'), t('ef_ausculta', 'Ausculta (BPM)')],
      [t('ef_variedadePosicao', 'Variedade de posição'), t('ef_grauInsinuacao', 'Grau de insinuação'), t('ef_conjugataVera', 'Conjugata vera')],
      [t('ef_foco', 'Foco'), t('ef_bcfBolsaAgua', 'BCP / Bolsa d\'água'), t('ef_corrimentoVaginal', 'Corrimento vaginal')],
      [t('ef_corrimentoCor', 'Cor'), t('ef_aparelhoRespiratorio', 'Aparelho respiratório'), t('ef_aparelhoCirculatorio', 'Aparelho circulatório')],
      [t('ef_particularidades', 'Particularidades / outras', 'area')],
    ],
  },
  {
    titulo: 'Diagnóstico e tratamento',
    linhas: [
      [t('dx_hipotese', 'Hipótese de diagnóstico', 'area')],
      [t('dx_definitivo', 'Diagnóstico definitivo', 'area')],
      [radio('dx_tratamentoTipo', 'Tratamento', ['Obstétrico', 'Clínico', 'Cirúrgico'])],
      [t('dx_tratamentoDescricao', 'Descrição do tratamento', 'area')],
    ],
  },
  {
    titulo: 'Parto e delivramento',
    linhas: [
      [t('parto_hora', 'Parto às (hora/data)'), t('parto_variedadePosicao', 'Variedade de posição no desprendimento'), t('parto_circularCordao', 'Circular do cordão')],
      [t('parto_lesoes', 'Lesões vaginoperineais'), t('parto_delivramento', 'Delivramento às'), t('parto_duracao', 'Duração total do parto')],
      [t('parto_sanguePerdido', 'Sangue perdido (ml)'), t('parto_placentaForma', 'Forma da placenta'), t('parto_placentaPeso', 'Peso (grs)')],
      [t('parto_aberturaMembranas', 'Abertura das membranas'), t('parto_insercaoCordao', 'Inserção do cordão')],
    ],
  },
  {
    titulo: 'Pequena intervenção cirúrgica',
    linhas: [
      [t('int_diagnostico', 'Diagnóstico'), t('int_operacao', 'Operação realizada')],
      [t('int_cirurgiao', 'Cirurgião'), t('int_auxiliar', 'Auxiliar')],
      [t('int_anestesista', 'Anestesista'), t('int_anestesia', 'Anestesia')],
      [t('int_horaInicio', 'Hora / início da operação'), t('int_duracao', 'Duração'), t('int_data', 'Data', 'data')],
      [t('int_descricao', 'Descrição', 'area')],
    ],
  },
  {
    titulo: 'Recém-nascido',
    linhas: [
      [t('rn_diagnostico', 'Diagnóstico'), t('rn_sexo', 'Sexo')],
      [t('rn_peso', 'Peso (kg)'), t('rn_comprimento', 'Comprimento (cm)'), t('rn_olhosProfilatica', 'Olhos: instalação profilática')],
      [t('rn_cordaoCurativo', 'Cordão / curativo'), t('rn_vitalidade', 'Condições de vitalidade'), t('rn_terapeutica', 'Terapêutica')],
    ],
  },
  {
    titulo: 'Condições de alta',
    linhas: [
      [t('alta_permanencia', 'Tempo de permanência hospitalar (dias)')],
      [
        radio('alta_categoria', 'Categoria', ['Gestante', 'Puérpera', 'Curada']),
        radio('alta_evolucao', 'Evolução', ['Melhorada', 'Inalterado', 'Piorado', 'Óbito']),
      ],
      [radio('alta_obitoEm', 'Óbito em', ['+ 48 horas', '- 48 horas']), t('alta_obitoData', 'Data/hora do óbito')],
      [radio('alta_motivo', 'Motivo', ['Decisão médica', 'Alta pedida', 'Transferência', 'Indisciplina'])],
      [t('alta_obs', 'Observações', 'area')],
    ],
  },
]

export const COLUNAS_TRABALHO_PARTO = [
  { key: 'data', label: 'Data' },
  { key: 'hora', label: 'Hora' },
  { key: 'dilatacao', label: 'Dilatação' },
  { key: 'apresentacao', label: 'Apresent.' },
  { key: 'variedadePosicao', label: 'Variedade de posição' },
  { key: 'bolsaDagua', label: 'B. d\'água' },
  { key: 'insinuacao', label: 'Insinuação' },
  { key: 'bcp', label: 'BCP' },
  { key: 'rubrica', label: 'Rubrica' },
] as const

export const COLUNAS_PUERPERIO = [
  { key: 'data', label: 'Data' },
  { key: 'utero', label: 'Útero (altura e consistência)' },
  { key: 'mamas', label: 'Mamas' },
  { key: 'loquios', label: 'Lóquios' },
  { key: 'rubrica', label: 'Rubrica' },
] as const

// ===== FICHA MÉDICA DE BERÇÁRIO =====

export const BERCARIO_IDENTIFICACAO: SecaoCampos = {
  titulo: 'Identificação do recém-nascido',
  campos: [
    c('rn_nascidoEnfermaria', 'Recém-nascido de enfermaria'),
    c('rn_leito', 'Leito / berço'),
    c('rn_recebidoBercario', 'Recebido no berçário às (data/hora)'),
    c('rn_condicoesAparentes', 'Condições aparentes'),
    c('rn_filiacaoPai', 'Filiação — pai'),
    c('rn_filiacaoMae', 'Filiação — mãe'),
    c('rn_residencia', 'Residência'),
    c('rn_telefone', 'Telefone'),
    c('rn_nascidoEm', 'Nascido às (data/hora)'),
    c('rn_sexo', 'Sexo'),
    c('rn_peso', 'Peso'),
    c('rn_estatura', 'Estatura'),
    c('rn_cranio', 'Crânio'),
    c('rn_torax', 'Tórax'),
  ],
}

export const BERCARIO_ANTECEDENTES: SecaoCampos = {
  titulo: 'Antecedentes pré-natais / parto',
  campos: [
    c('ant_paiIdade', 'Pai — idade'),
    c('ant_paiCor', 'Pai — cor'),
    c('ant_paiRh', 'Pai — Rh'),
    c('ant_maeIdade', 'Mãe — idade'),
    c('ant_maeCor', 'Mãe — cor'),
    c('ant_maeRh', 'Mãe — Rh'),
    c('ant_gestacaoPartos', 'Gestação e partos anteriores'),
    c('ant_gestacao', 'Gestação / paridade'),
    c('ant_fezPreNatal', 'Fez pré-natal'),
    c('ant_ultimoParto', 'Último parto'),
    c('ant_filhosVivos', 'Filhos vivos'),
    c('ant_mortos', 'Mortos'),
    c('ant_prematuros', 'Prematuros'),
    c('ant_natimortos', 'Natimortos'),
    c('ant_abortamentos', 'Abortamentos'),
    c('ant_puerperios', 'Puerpérios'),
    c('ant_lactacao', 'Lactação'),
  ],
}

export const BERCARIO_EXAME: SecaoCampos = {
  titulo: 'Exame clínico geral',
  campos: [
    c('ex_biograma', 'Biograma'),
    c('ex_exameClinico', 'Exame clínico geral', 'area'),
    c('ex_diagnosticoProvisorio', 'Diagnóstico provisório'),
    c('ex_exameComplementar', 'Exame complementar'),
    c('ex_tratamento', 'Tratamento', 'area'),
    c('ex_rw', 'RW'),
    c('ex_rh', 'Rh'),
    c('ex_grupoSanguineo', 'Grupo sanguíneo'),
    c('ex_coombs', 'Coombs'),
    c('ex_diagnosticoFinal', 'Diagnóstico final'),
    c('ex_bcg', 'B.C.G.'),
    c('ex_altaData', 'Alta — data', 'data'),
    c('ex_condicoes', 'Condições de alta'),
    c('ex_tratamentoSeguir', 'Tratamento a seguir', 'area'),
  ],
}

export const SECOES_BERCARIO: SecaoCampos[] = [
  BERCARIO_IDENTIFICACAO,
  BERCARIO_ANTECEDENTES,
  BERCARIO_EXAME,
]
