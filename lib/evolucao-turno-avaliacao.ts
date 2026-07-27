// lib/evolucao-turno-avaliacao.ts
// Opções da avaliação de enfermagem por sistema corporal (ficha Evolução Diurna/Noturna)

export type OpcaoAvaliacao = {
  value: string
  label: string
  /** Quando selecionada, exibe um campo de texto livre com esta chave. */
  textoKey?: string
  textoLabel?: string
}

export type GrupoAvaliacao = {
  key: string
  label?: string
  opcoes: OpcaoAvaliacao[]
}

export type CampoTextoAvaliacao = {
  key: string
  label: string
}

export type SistemaAvaliacao = {
  key: string
  titulo: string
  grupos: GrupoAvaliacao[]
  /** Campos de texto sempre visíveis (não atrelados a uma opção). */
  camposTexto?: CampoTextoAvaliacao[]
}

const o = (value: string, label: string, extra?: Partial<OpcaoAvaliacao>): OpcaoAvaliacao => ({
  value,
  label,
  ...extra,
})

export const SISTEMAS_AVALIACAO: SistemaAvaliacao[] = [
  {
    key: 'estadoGeral',
    titulo: 'Estado geral',
    grupos: [
      {
        key: 'estadoGeral',
        opcoes: [o('BOM', 'Bom'), o('REGULAR', 'Regular'), o('COMPROMETIDO', 'Comprometido'), o('GRAVE', 'Grave')],
      },
    ],
  },
  {
    key: 'estadoNutricional',
    titulo: 'Estado nutricional',
    grupos: [
      {
        key: 'nutricional',
        opcoes: [
          o('NORMAL', 'Normal'),
          o('DESNUTRIDO', 'Desnutrido'),
          o('CAQUEXIA', 'Caquexia'),
          o('OBESIDADE', 'Obesidade'),
        ],
      },
      {
        key: 'dietaAceitacao',
        label: 'Dieta',
        opcoes: [
          o('BOA_ACEITACAO', 'Boa aceitação'),
          o('ACEITACAO_REGULAR', 'Aceitação regular'),
          o('NAO_ACEITA', 'Não aceita'),
        ],
      },
      {
        key: 'viaAlimentacao',
        label: 'Via',
        opcoes: [
          o('ORAL', 'Oral'),
          o('SNG', 'SNG', { textoKey: 'sngNumero', textoLabel: 'SNG Nº' }),
          o('SNE', 'SNE', { textoKey: 'sneNumero', textoLabel: 'SNE Nº' }),
        ],
      },
    ],
  },
  {
    key: 'neurologica',
    titulo: 'Avaliação neurológica',
    grupos: [
      {
        key: 'nivelConsciencia',
        opcoes: [
          o('CONSCIENTE', 'Consciente'),
          o('ALERTA', 'Alerta'),
          o('INCONSCIENTE', 'Inconsciente'),
          o('SONOLENTO', 'Sonolento'),
        ],
      },
      {
        key: 'orientacao',
        opcoes: [o('ORIENTADO', 'Orientado'), o('CONFUSO', 'Confuso'), o('DESORIENTADO', 'Desorientado')],
      },
    ],
  },
  {
    key: 'pele',
    titulo: 'Avaliação da pele',
    grupos: [
      {
        key: 'coloracao',
        opcoes: [
          o('NORMOCORADA', 'Normocorada'),
          o('HIPOCORADA', 'Hipocorada'),
          o('HIPERCORADA', 'Hipercorada'),
          o('ICTERICA', 'Ictérica'),
        ],
      },
      {
        key: 'hidratacao',
        opcoes: [o('HIDRATADA', 'Hidratada'), o('DESIDRATADA', 'Desidratada')],
      },
      {
        key: 'ulceraPressao',
        label: 'Úlcera por pressão',
        opcoes: [o('NAO', 'Não'), o('SIM', 'Sim', { textoKey: 'ulceraLocal', textoLabel: 'Local' })],
      },
    ],
  },
  {
    key: 'respiratorio',
    titulo: 'Sistema respiratório',
    grupos: [
      {
        key: 'padraoRespiratorio',
        opcoes: [
          o('EUPNEICO', 'Eupnéico'),
          o('DISPNEICO', 'Dispnéico'),
          o('TAQUIPNEICO', 'Taquipnéico'),
          o('BRADIPNEICO', 'Bradipnéico'),
        ],
      },
      {
        key: 'tosse',
        label: 'Tosse',
        opcoes: [o('PRODUTIVA', 'Produtiva'), o('SECA', 'Seca'), o('AUSENTE', 'Ausente')],
      },
      {
        key: 'suporteVentilatorio',
        label: 'Suporte ventilatório',
        opcoes: [o('SIM', 'Sim'), o('NAO', 'Não')],
      },
    ],
  },
  {
    key: 'cardiovascular',
    titulo: 'Sistema cardiovascular',
    grupos: [
      {
        key: 'batimentoCardiaco',
        label: 'Batimento cardíaco',
        opcoes: [o('REGULAR', 'Regular'), o('IRREGULAR', 'Irregular')],
      },
      {
        key: 'pulso',
        label: 'Pulso',
        opcoes: [
          o('NORMOSFIGMICO', 'Normosfígmico'),
          o('TAQUISFIGMICO', 'Taquisfígmico'),
          o('BRADISFIGMICO', 'Bradisfígmico'),
        ],
      },
      {
        key: 'pressaoArterial',
        label: 'Pressão arterial',
        opcoes: [o('NORMOTENSO', 'Normotenso'), o('HIPERTENSO', 'Hipertenso'), o('HIPOTENSO', 'Hipotenso')],
      },
    ],
  },
  {
    key: 'gastrointestinal',
    titulo: 'Sistema gastrointestinal',
    grupos: [
      {
        key: 'evacuacoes',
        label: 'Evacuações',
        opcoes: [
          o('PRESENTE', 'Presente'),
          o('AUSENTE', 'Ausente'),
          o('PASTOSO', 'Pastoso'),
          o('LIQUIDO', 'Líquido'),
          o('SOLIDO', 'Sólido'),
        ],
      },
      {
        key: 'emese',
        label: 'Êmese',
        opcoes: [o('SIM', 'Sim'), o('NAO', 'Não')],
      },
    ],
  },
  {
    key: 'geniturinario',
    titulo: 'Sistema geniturinário',
    grupos: [
      {
        key: 'diurese',
        label: 'Diurese',
        opcoes: [o('ESPONTANEA', 'Espontânea'), o('SVD', 'SVD'), o('SVA', 'SVA')],
      },
      {
        key: 'aspectoUrina',
        label: 'Aspecto da urina',
        opcoes: [
          o('LIMPIDA', 'Límpida'),
          o('AMARELO_CITRINO', 'Amarelo citrino'),
          o('CONCENTRADA', 'Concentrada'),
          o('PIURIA', 'Piúria'),
          o('HEMATURIA', 'Hematúria'),
        ],
      },
    ],
    camposTexto: [{ key: 'volumeUrina', label: 'Volume da urina (ml, se em sonda)' }],
  },
  {
    key: 'musculoesqueletico',
    titulo: 'Sistema musculoesquelético',
    grupos: [
      {
        key: 'mobilidade',
        label: 'Mobilidade',
        opcoes: [o('ATIVA', 'Ativa'), o('DIMINUIDA', 'Diminuída'), o('AUSENTE', 'Ausente')],
      },
      {
        key: 'edema',
        label: 'Edema',
        opcoes: [o('PRESENTE', 'Presente'), o('AUSENTE', 'Ausente')],
      },
      {
        key: 'edemaLocal',
        label: 'Local do edema',
        opcoes: [
          o('MMSS', 'MMSS'),
          o('MMII', 'MMII'),
          o('OUTROS', 'Outros', { textoKey: 'edemaOutros', textoLabel: 'Especificar' }),
        ],
      },
    ],
  },
]

export type AvaliacaoSistemas = Record<string, string>

/** Resumo legível de uma avaliação para impressão/histórico. */
export function resumirAvaliacaoSistemas(av: AvaliacaoSistemas | null | undefined): string {
  if (!av) return ''
  const linhas: string[] = []
  for (const sistema of SISTEMAS_AVALIACAO) {
    const partes: string[] = []
    for (const grupo of sistema.grupos) {
      const sel = av[grupo.key]
      if (!sel) continue
      const opcao = grupo.opcoes.find((op) => op.value === sel)
      if (!opcao) continue
      let txt = opcao.label
      if (opcao.textoKey && av[opcao.textoKey]?.trim()) {
        txt += ` ${av[opcao.textoKey].trim()}`
      }
      partes.push(grupo.label ? `${grupo.label}: ${txt}` : txt)
    }
    for (const campo of sistema.camposTexto ?? []) {
      if (av[campo.key]?.trim()) partes.push(`${campo.label}: ${av[campo.key].trim()}`)
    }
    if (partes.length) linhas.push(`${sistema.titulo} — ${partes.join('; ')}`)
  }
  return linhas.join('\n')
}
