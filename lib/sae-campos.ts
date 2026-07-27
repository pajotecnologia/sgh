// lib/sae-campos.ts — Definições da ficha SAE (Sistematização da Assistência de Enfermagem)

export type OpcaoSae = { value: string; label: string; textoKey?: string; textoLabel?: string }
export type GrupoSae = {
  key: string
  label?: string
  multi?: boolean
  opcoes: OpcaoSae[]
}
export type SecaoSae = { titulo: string; grupos: GrupoSae[] }

const o = (value: string, label: string, extra?: Partial<OpcaoSae>): OpcaoSae => ({ value, label, ...extra })

// Identificação de risco (topo da ficha)
export const RISCOS_SAE: GrupoSae = {
  key: 'identificacaoRisco',
  label: 'Identificação de risco',
  multi: true,
  opcoes: [
    o('QUEDA', 'Queda'),
    o('FLEBITE', 'Flebite'),
    o('ERRO_MEDICACAO', 'Erro de medicação'),
    o('LESAO_PRESSAO', 'Lesão por pressão'),
    o('EXTUBACAO_ACIDENTAL', 'Extubação acidental'),
    o('PERDA_SNG_SNE', 'Perda de SNG/SNE'),
    o('OUTROS', 'Outros', { textoKey: 'riscoOutros', textoLabel: 'Especificar' }),
  ],
}

// Exame físico
export const EXAME_FISICO_SAE: SecaoSae = {
  titulo: 'Exame físico',
  grupos: [
    {
      key: 'estadoGeral',
      label: '1. Estado geral',
      opcoes: [o('REGULAR', 'Regular'), o('COMPROMETIDO', 'Comprometido'), o('GRAVE', 'Grave')],
    },
    {
      key: 'nivelConsciencia',
      label: '2. Nível de consciência',
      multi: true,
      opcoes: [
        o('CONSCIENTE', 'Consciente'),
        o('ORIENTADO', 'Orientado'),
        o('DESORIENTADO', 'Desorientado'),
        o('CONFUSO', 'Confuso'),
        o('SONOLENTO', 'Sonolento'),
        o('INCONSCIENTE', 'Inconsciente'),
        o('TORPOROSO', 'Torporoso'),
        o('COMATOSO', 'Comatoso'),
      ],
    },
    {
      key: 'pupilas',
      label: 'Pupilas',
      multi: true,
      opcoes: [
        o('ISOCORICAS', 'Isocóricas'),
        o('ANISOCORICAS', 'Anisocóricas'),
        o('REAGENTES', 'Reagentes'),
        o('NAO_REAGENTES', 'Não reagentes'),
        o('ESTRABISMO', 'Estrabismo'),
        o('MIDRIASE', 'Midríase'),
        o('MIOSE', 'Miose'),
      ],
    },
    {
      key: 'estadoEmocional',
      label: '3. Estado emocional',
      multi: true,
      opcoes: [
        o('CALMO', 'Calmo'),
        o('COLABORADOR', 'Colaborador/Comunicativo'),
        o('DEPRIMIDO', 'Deprimido'),
        o('AGITADO', 'Agitado'),
      ],
    },
    {
      key: 'sonoRepouso',
      label: '4. Sono e repouso',
      opcoes: [o('CONCILIA', 'Concilia o sono'), o('NAO_CONCILIA', 'Não concilia o sono')],
    },
    {
      key: 'pele',
      label: '5. Pele',
      multi: true,
      opcoes: [
        o('INTEGRA', 'Íntegra'),
        o('NORMOCORADA', 'Normocorada'),
        o('HIPOCORADA', 'Hipocorada'),
        o('ICTERICA', 'Ictérica'),
        o('HIDRATADA', 'Hidratada'),
        o('DESIDRATADA', 'Desidratada'),
        o('CIANOTICA', 'Cianótica'),
        o('ACIANOTICA', 'Acianótica'),
        o('EQUIMOSES', 'Equimoses'),
        o('ERITEMA', 'Eritema'),
        o('PETEQUIAS', 'Petéquias'),
        o('EDEMA', 'Edema', { textoKey: 'peleEdema', textoLabel: 'Local/grau' }),
        o('ANASARCA', 'Anasarca'),
        o('FEBRIL', 'Febril', { textoKey: 'peleFebrilTemp', textoLabel: '°C' }),
        o('AFEBRIL', 'Afebril'),
      ],
    },
    {
      key: 'respiratorio',
      label: '6. Sistema respiratório',
      multi: true,
      opcoes: [
        o('EUPNEICO', 'Eupnéico'),
        o('DISPNEICO', 'Dispnéico'),
        o('TAQUIPNEICO', 'Taquipnéico'),
        o('APNEIA', 'Apnéia'),
      ],
    },
    {
      key: 'tosse',
      label: 'Tosse',
      multi: true,
      opcoes: [
        o('SIM', 'Sim'),
        o('NAO', 'Não'),
        o('SEM_EXPECTORACAO', 's/ expectoração'),
        o('COM_EXPECTORACAO', 'c/ expectoração'),
        o('PURULENTA', 'Purulenta'),
        o('HEMATICA', 'Hemática'),
        o('MUCOIDE', 'Mucoide'),
      ],
    },
    {
      key: 'oxigenacao',
      label: 'Oxigenação',
      multi: true,
      opcoes: [
        o('AMBIENTE', 'Ambiente'),
        o('CATETER_NASAL', 'Cateter nasal'),
        o('VENTURI', 'Venturi', { textoKey: 'venturiPercent', textoLabel: '%' }),
        o('TAQUEOSTOMIA', 'Taqueostomia'),
        o('VNI', 'VNI'),
        o('BIPAP', 'Bipap'),
        o('CPAP', 'CPAP'),
      ],
    },
    {
      key: 'cardiovascular',
      label: '7. Sistema cardiovascular',
      multi: true,
      opcoes: [o('RC_REGULAR', 'RC Regular'), o('ARRITMIA', 'Arritmia'), o('GALOPE', 'Galope'), o('SOPRO', 'Sopro')],
    },
    {
      key: 'bulhas',
      label: 'Bulhas',
      opcoes: [o('NORMOFONETICAS', 'Normofonéticas'), o('HIPOFONETICAS', 'Hipofonéticas')],
    },
    {
      key: 'acessoVenoso',
      label: 'Acesso venoso',
      multi: true,
      opcoes: [
        o('SIM', 'Sim'),
        o('NAO', 'Não'),
        o('PERIFERICO', 'Periférico', { textoKey: 'acessoPerifericoLocal', textoLabel: 'Local' }),
        o('SUBCLAVIA', 'Subclávia'),
        o('DISSECCAO', 'Dissecção venosa'),
        o('JUGULAR', 'Jugular'),
      ],
    },
    {
      key: 'dieta',
      label: '8. Dieta',
      multi: true,
      opcoes: [
        o('ORAL', 'Oral'),
        o('SNG', 'SNG'),
        o('SNE', 'SNE'),
        o('GAVAGEM', 'Gavagem'),
        o('PARENTERAL', 'Parenteral'),
        o('GASTROSTOMIA', 'Gastrostomia'),
        o('BOA_ACEITACAO', 'Boa aceitação'),
        o('POUCA_ACEITACAO', 'Pouca aceitação'),
        o('ZERO', 'Zero'),
      ],
    },
    {
      key: 'abdome',
      label: 'Abdome',
      multi: true,
      opcoes: [
        o('DOLOR', 'Dolor', { textoKey: 'abdomeLocal', textoLabel: 'Local' }),
        o('PLANO', 'Plano'),
        o('FLACIDO', 'Flácido'),
        o('TENSO', 'Tenso'),
        o('DISTENDIDO', 'Distendido'),
        o('GLOBOSO', 'Globoso'),
        o('RH_MAIS', 'RH+'),
        o('RH_MENOS', 'RH-'),
        o('OSTOMIA', 'Ostomia'),
        o('DRENO', 'Dreno', { textoKey: 'abdomeDrenoTipo', textoLabel: 'Tipo' }),
      ],
    },
    {
      key: 'fo',
      label: 'FO (ferida operatória)',
      multi: true,
      opcoes: [o('SIM', 'Sim', { textoKey: 'foLocal', textoLabel: 'Local' }), o('NAO', 'Não')],
    },
    {
      key: 'emese',
      label: 'Êmese',
      multi: true,
      opcoes: [o('SIM', 'Sim', { textoKey: 'emeseAspecto', textoLabel: 'Aspecto' }), o('NAO', 'Não')],
    },
    {
      key: 'evacuacoes',
      label: 'Evacuações',
      multi: true,
      opcoes: [
        o('NORMAL', 'Normal'),
        o('CONSTIPACAO', 'Constipação'),
        o('DIARREIA', 'Diarreia', { textoKey: 'diarreiaVezes', textoLabel: 'vezes/dia' }),
        o('FECALOMA', 'Fecaloma'),
        o('FLATULENCIA', 'Flatulência'),
        o('COLOSTOMIA', 'Colostomia'),
        o('MELENA', 'Melena'),
        o('OUTRO', 'Outro', { textoKey: 'evacuacoesOutro', textoLabel: 'Especificar' }),
      ],
    },
    {
      key: 'geniturinarioAlteracoes',
      label: 'D. Sistema geniturinário — alterações',
      multi: true,
      opcoes: [o('PRURIDO', 'Prurido'), o('SECRECAO', 'Secreção', { textoKey: 'guSecrecaoAspecto', textoLabel: 'Aspecto' })],
    },
    {
      key: 'diurese',
      label: 'Diurese',
      multi: true,
      opcoes: [
        o('NORMAL', 'Normal'),
        o('HEMATURIA', 'Hematúria'),
        o('COLURIA', 'Colúria'),
        o('INCONTINENCIA', 'Incontinência'),
        o('OLIGURIA', 'Oligúria'),
        o('ANURIA', 'Anúria'),
        o('SVD', 'SVD'),
        o('SVA', 'SVA', { textoKey: 'svaHoras', textoLabel: 'horas' }),
        o('CISTOSTOMIA', 'Cistostomia'),
        o('IRRIGACAO', 'Irrigação'),
        o('PRESERVATIVO', 'Preservativo'),
        o('FRALDAO', 'Fraldão'),
      ],
    },
    {
      key: 'fluxoMenstrual',
      label: 'Fluxo menstrual',
      multi: true,
      opcoes: [
        o('REGULAR', 'Regular'),
        o('IRREGULAR', 'Irregular'),
        o('METRORRAGIA', 'Metrorragia'),
        o('MENOPAUSA', 'Menopausa'),
        o('DISMENORREIA', 'Dismenorréia'),
      ],
    },
    {
      key: 'mobilidade',
      label: '11. Sistema músculo esquelético — mobilidade',
      opcoes: [o('ATIVA', 'Ativa'), o('PASSIVA', 'Passiva')],
    },
    {
      key: 'forcaMotora',
      label: 'Força motora',
      opcoes: [o('SIM', 'Sim'), o('NAO', 'Não')],
    },
    {
      key: 'fisioterapia',
      label: 'Fisioterapia',
      multi: true,
      opcoes: [o('SIM', 'Sim'), o('NAO', 'Não'), o('MOTORA', 'Motora'), o('RESPIRATORIA', 'Respiratória')],
    },
    {
      key: 'musculoAlteracoes',
      label: 'Alterações',
      multi: true,
      opcoes: [
        o('TALA_GESSADA', 'Tala gessada'),
        o('GESSO', 'Gesso'),
        o('FIXADOR_EXTERNO', 'Fixador externo'),
        o('AMPUTACAO', 'Amputação', { textoKey: 'amputacaoLocal', textoLabel: 'Local' }),
      ],
    },
    {
      key: 'grauDependencia',
      label: 'Grau de dependência da enfermagem',
      opcoes: [o('TOTAL', 'Total'), o('PARCIAL', 'Parcial'), o('INDEPENDENTE', 'Independente')],
    },
    {
      key: 'tipoFerida',
      label: 'Q. Tipo de ferida',
      multi: true,
      opcoes: [
        o('FO_COM_DRENO', 'FO c/ dreno'),
        o('FO_SEM_DRENO', 'FO s/ dreno'),
        o('LESAO_PRESSAO', 'Lesão por pressão'),
        o('PE_DIABETICO', 'Pé diabético'),
        o('ULCERA_VENOSA', 'Úlcera venosa'),
        o('ULCERA_ARTERIAL', 'Úlcera arterial'),
        o('QUEIMADURA', 'Queimadura'),
      ],
    },
    {
      key: 'desbridamento',
      label: 'Desbridamento',
      multi: true,
      opcoes: [
        o('AUTOLITICO', 'Autolítico'),
        o('CIRURGICO', 'Cirúrgico'),
        o('ENZIMATICO', 'Enzimático'),
        o('MECANICO', 'Mecânico'),
      ],
    },
    {
      key: 'ferimentoInfectado',
      label: 'Ferimento infectado',
      opcoes: [o('SIM', 'Sim'), o('NAO', 'Não')],
    },
  ],
}

// Diagnósticos de enfermagem (página 2)
export const DIAGNOSTICOS_SAE: OpcaoSae[] = [
  o('ALERGIA', 'Alergia a', { textoKey: 'diagAlergia', textoLabel: 'Especificar' }),
  o('DEGLUTICAO_PREJ', 'Deglutição prejudicada'),
  o('NUTRICAO_DESEQUILIBRADA', 'Nutrição desequilibrada: menor que as necessidades corporais'),
  o('RISCO_GLICEMIA', 'Risco de glicemia instável'),
  o('RISCO_ELETROLITICO', 'Risco de desequilíbrio eletrolítico'),
  o('ELIMINACAO_URINARIA_PREJ', 'Eliminação urinária prejudicada'),
  o('CONSTIPACAO', 'Constipação'),
  o('DIARREIA', 'Diarreia'),
  o('PADRAO_SONO_PREJ', 'Padrão de sono prejudicado'),
  o('DEAMBULACAO_PREJ', 'Deambulação prejudicada'),
  o('MOBILIDADE_FISICA_PREJ', 'Mobilidade física prejudicada'),
  o('COMUNICACAO_VERBAL_PREJ', 'Comunicação verbal prejudicada'),
  o('ANSIEDADE', 'Ansiedade'),
  o('RISCO_INFECCAO', 'Risco de infecção'),
  o('RISCO_ASPIRACAO', 'Risco de aspiração'),
  o('INTEGRIDADE_PELE_PREJ', 'Integridade da pele prejudicada'),
  o('DOR_AGUDA', 'Dor aguda'),
  o('NAUSEA', 'Náusea'),
]

// Prescrições de enfermagem (página 2)
export const PRESCRICOES_SAE: OpcaoSae[] = [
  o('VERIFICAR_SSW', 'Verificar SSVV', { textoKey: 'presSsvvHoras', textoLabel: '/hs' }),
  o('BANHO_LEITO', 'Realizar/auxiliar banho no leito'),
  o('MUDANCA_DECUBITO', 'Realizar/orientar mudança de decúbito', { textoKey: 'presDecubitoHoras', textoLabel: '/hs' }),
  o('HIDRATAR_PELE', 'Hidratar e massagear a pele quando necessário'),
  o('CABECEIRA_ELEVADA', 'Manter cabeceira elevada', { textoKey: 'presCabeceira', textoLabel: 'Grau' }),
  o('OXIGENIOTERAPIA', 'Ministrar oxigenioterapia umidificada', { textoKey: 'presO2', textoLabel: 'l/min' }),
  o('ACESSO_VENOSO', 'Estabelecer acesso venoso periférico e identificar o mesmo'),
  o('TROCAR_EQUIPOS', 'Trocar equipos, extensores, polifix e AVP conforme rotina da CCIH'),
  o('LAVAR_SONDA', 'Lavar sonda após ingesta de alimentos ou medicamentos'),
  o('ADMINISTRAR_MEDS', 'Administrar medicações e fluidos conforme prescrição médica'),
  o('OBSERVAR_PERDAS', 'Observar, registrar e comunicar aspecto e quantidade de perdas extraordinárias (vômitos, diarreia, drenos e sondas)'),
  o('CURATIVO_BAIXA', 'Realizar curativo de baixa complexidade'),
  o('HIGIENE_ORAL', 'Estimular ou realizar/auxiliar higiene oral'),
  o('ASPIRAR_VIAS', 'Aspirar cavidade oral e/ou vias aéreas superiores s/n'),
  o('PROTEGER_OSSEAS', 'Proteger proeminências ósseas'),
  o('REALIZAR_CURATIVO', 'Realizar curativo', { textoKey: 'presCurativoVezes', textoLabel: 'vezes ao dia' }),
  o('ELEVAR_MMII', 'Elevar MMII para reduzir edemas'),
]
