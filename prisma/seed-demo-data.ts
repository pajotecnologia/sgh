/**
 * Dados fictícios para seed — pacientes, endereços, queixas, etc.
 */
import type {
  CorTriagem,
  SexoBiologico,
  StatusAtendimento,
  TipoSanguineo,
} from '@prisma/client'

export type PacienteDemo = {
  cpf: string
  nomeCompleto: string
  dataNascimento: string
  sexoBiologico: SexoBiologico
  tipoSanguineo: TipoSanguineo
  convenio: string | null
  nomeMae: string
  profissao: string
  telefone: string
  endereco: {
    cep: string
    logradouro: string
    numero: string
    bairro: string
    cidade: string
    estado: string
  }
  alergias: { descricao: string; gravidade: string }[]
  medicamentos: { nome: string; dose: string; frequencia: string }[]
}

export type AtendimentoDemo = {
  /** índice do paciente (0-based) */
  pacienteIdx: number
  status: StatusAtendimento
  origemIdx: number
  setor: string
  /** horas atrás do createdAt */
  horasAtras: number
  triagem?: {
    cor: CorTriagem
    queixa: string
    categoria: string
    paSistolica: number
    paDiastolica: number
    fc: number
    fr: number
    spo2: number
    temp: number
    dor: number
  }
  prontuario?: {
    cid: string
    cidDesc: string
    medicamento: string
    exame: string
  }
}

export const ORIGENS_DEMO = [
  { descricao: 'Demanda espontânea', procedenciaFicha: 'ESPONTÂNEA' },
  { descricao: 'SAMU', procedenciaFicha: 'SAMU' },
  { descricao: 'UPA referenciada', procedenciaFicha: 'TRANSFERÊNCIA UPA' },
  { descricao: 'UBS referenciada', procedenciaFicha: 'UBS' },
  { descricao: 'Polícia / resgate', procedenciaFicha: 'RESGATE' },
]

export const PACIENTES_DEMO: PacienteDemo[] = [
  {
    cpf: '52998224725',
    nomeCompleto: 'Maria Aparecida Santos',
    dataNascimento: '1985-03-12',
    sexoBiologico: 'FEMININO',
    tipoSanguineo: 'O_POSITIVO',
    convenio: 'SUS',
    nomeMae: 'Helena Santos',
    profissao: 'Doméstica',
    telefone: '11987654321',
    endereco: { cep: '01310100', logradouro: 'Av. Paulista', numero: '1000', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP' },
    alergias: [{ descricao: 'DIPIRONA', gravidade: 'Moderada' }],
    medicamentos: [{ nome: 'LOSARTANA', dose: '50MG', frequencia: '1X AO DIA' }],
  },
  {
    cpf: '39053344705',
    nomeCompleto: 'João Carlos Oliveira',
    dataNascimento: '1972-07-22',
    sexoBiologico: 'MASCULINO',
    tipoSanguineo: 'A_POSITIVO',
    convenio: null,
    nomeMae: 'Rosa Oliveira',
    profissao: 'Motorista',
    telefone: '11976543210',
    endereco: { cep: '04038001', logradouro: 'Rua Vergueiro', numero: '250', bairro: 'Vila Mariana', cidade: 'São Paulo', estado: 'SP' },
    alergias: [],
    medicamentos: [{ nome: 'METFORMINA', dose: '850MG', frequencia: '2X AO DIA' }],
  },
  {
    cpf: '15350946056',
    nomeCompleto: 'Ana Beatriz Ferreira Lima',
    dataNascimento: '1998-11-05',
    sexoBiologico: 'FEMININO',
    tipoSanguineo: 'B_NEGATIVO',
    convenio: 'UNIMED',
    nomeMae: 'Cláudia Lima',
    profissao: 'Estudante',
    telefone: '11965432109',
    endereco: { cep: '04543011', logradouro: 'Av. Brigadeiro Faria Lima', numero: '1500', bairro: 'Itaim Bibi', cidade: 'São Paulo', estado: 'SP' },
    alergias: [{ descricao: 'PENICILINA', gravidade: 'Grave' }],
    medicamentos: [],
  },
  {
    cpf: '28739286019',
    nomeCompleto: 'Pedro Henrique Souza',
    dataNascimento: '1960-01-18',
    sexoBiologico: 'MASCULINO',
    tipoSanguineo: 'AB_POSITIVO',
    convenio: 'SUS',
    nomeMae: 'Francisca Souza',
    profissao: 'Aposentado',
    telefone: '11954321098',
    endereco: { cep: '03015000', logradouro: 'Rua do Gasômetro', numero: '88', bairro: 'Brás', cidade: 'São Paulo', estado: 'SP' },
    alergias: [{ descricao: 'LÁTEX', gravidade: 'Leve' }],
    medicamentos: [
      { nome: 'AAS', dose: '100MG', frequencia: '1X AO DIA' },
      { nome: 'SINVASTATINA', dose: '20MG', frequencia: '1X À NOITE' },
    ],
  },
  {
    cpf: '44634588085',
    nomeCompleto: 'Lucia Helena Costa',
    dataNascimento: '1990-09-30',
    sexoBiologico: 'FEMININO',
    tipoSanguineo: 'A_NEGATIVO',
    convenio: null,
    nomeMae: 'Teresa Costa',
    profissao: 'Enfermeira',
    telefone: '11943210987',
    endereco: { cep: '05001000', logradouro: 'Rua da Consolação', numero: '420', bairro: 'Consolação', cidade: 'São Paulo', estado: 'SP' },
    alergias: [],
    medicamentos: [],
  },
  {
    cpf: '61849273003',
    nomeCompleto: 'Roberto Almeida Pereira',
    dataNascimento: '1955-04-08',
    sexoBiologico: 'MASCULINO',
    tipoSanguineo: 'O_NEGATIVO',
    convenio: 'Bradesco Saúde',
    nomeMae: 'Maria Pereira',
    profissao: 'Comerciante',
    telefone: '11932109876',
    endereco: { cep: '02012000', logradouro: 'Av. Cel. Sezefredo Fagundes', numero: '1200', bairro: 'Tucuruvi', cidade: 'São Paulo', estado: 'SP' },
    alergias: [{ descricao: 'DIPIRONA', gravidade: 'Leve' }],
    medicamentos: [{ nome: 'ENALAPRIL', dose: '10MG', frequencia: '2X AO DIA' }],
  },
  {
    cpf: '73482915088',
    nomeCompleto: 'Fernanda Rodrigues Martins',
    dataNascimento: '2001-06-14',
    sexoBiologico: 'FEMININO',
    tipoSanguineo: 'O_POSITIVO',
    convenio: 'SUS',
    nomeMae: 'Sandra Martins',
    profissao: 'Auxiliar administrativo',
    telefone: '11921098765',
    endereco: { cep: '03102001', logradouro: 'Rua do Orfanato', numero: '555', bairro: 'Vila Prudente', cidade: 'São Paulo', estado: 'SP' },
    alergias: [],
    medicamentos: [],
  },
  {
    cpf: '85173649001',
    nomeCompleto: 'Marcos Antônio Ribeiro',
    dataNascimento: '1988-12-25',
    sexoBiologico: 'MASCULINO',
    tipoSanguineo: 'B_POSITIVO',
    convenio: null,
    nomeMae: 'Aparecida Ribeiro',
    profissao: 'Pedreiro',
    telefone: '11910987654',
    endereco: { cep: '08010000', logradouro: 'Av. Marechal Tito', numero: '3000', bairro: 'São Miguel', cidade: 'São Paulo', estado: 'SP' },
    alergias: [{ descricao: 'IBUPROFENO', gravidade: 'Moderada' }],
    medicamentos: [],
  },
  {
    cpf: '96284571022',
    nomeCompleto: 'Juliana Cristina Nunes',
    dataNascimento: '1978-02-17',
    sexoBiologico: 'FEMININO',
    tipoSanguineo: 'A_POSITIVO',
    convenio: 'Amil',
    nomeMae: 'Neuza Nunes',
    profissao: 'Professora',
    telefone: '11909876543',
    endereco: { cep: '05508000', logradouro: 'Rua Capote Valente', numero: '90', bairro: 'Pinheiros', cidade: 'São Paulo', estado: 'SP' },
    alergias: [],
    medicamentos: [{ nome: 'LEVOTIROXINA', dose: '75MCG', frequencia: '1X EM JEJUM' }],
  },
  {
    cpf: '17395862033',
    nomeCompleto: 'Antonio José Barbosa',
    dataNascimento: '1948-08-03',
    sexoBiologico: 'MASCULINO',
    tipoSanguineo: 'DESCONHECIDO',
    convenio: 'SUS',
    nomeMae: 'Josefina Barbosa',
    profissao: 'Aposentado',
    telefone: '11898765432',
    endereco: { cep: '01001000', logradouro: 'Praça da Sé', numero: '50', bairro: 'Sé', cidade: 'São Paulo', estado: 'SP' },
    alergias: [{ descricao: 'CONTRASTE IODADO', gravidade: 'Grave' }],
    medicamentos: [
      { nome: 'FUROSEMIDA', dose: '40MG', frequencia: '1X AO DIA' },
      { nome: 'CARVEDILOL', dose: '6,25MG', frequencia: '2X AO DIA' },
    ],
  },
  {
    cpf: '28406739044',
    nomeCompleto: 'Camila Duarte Silveira',
    dataNascimento: '1995-05-20',
    sexoBiologico: 'FEMININO',
    tipoSanguineo: 'O_POSITIVO',
    convenio: null,
    nomeMae: 'Eliane Silveira',
    profissao: 'Designer',
    telefone: '11887654321',
    endereco: { cep: '05407002', logradouro: 'Rua Fradique Coutinho', numero: '700', bairro: 'Pinheiros', cidade: 'São Paulo', estado: 'SP' },
    alergias: [],
    medicamentos: [],
  },
  {
    cpf: '39517846055',
    nomeCompleto: 'Ricardo Mendes Gomes',
    dataNascimento: '1982-10-11',
    sexoBiologico: 'MASCULINO',
    tipoSanguineo: 'A_POSITIVO',
    convenio: 'SUS',
    nomeMae: 'Lúcia Gomes',
    profissao: 'Técnico de enfermagem',
    telefone: '11876543210',
    endereco: { cep: '04101000', logradouro: 'Rua Domingos de Morais', numero: '1800', bairro: 'Vila Mariana', cidade: 'São Paulo', estado: 'SP' },
    alergias: [{ descricao: 'SULFA', gravidade: 'Moderada' }],
    medicamentos: [],
  },
  {
    cpf: '40628957066',
    nomeCompleto: 'Patricia Alves Carvalho',
    dataNascimento: '1970-03-28',
    sexoBiologico: 'FEMININO',
    tipoSanguineo: 'B_POSITIVO',
    convenio: 'NotreDame',
    nomeMae: 'Ivone Carvalho',
    profissao: 'Contadora',
    telefone: '11865432109',
    endereco: { cep: '01452000', logradouro: 'Av. Rebouças', numero: '2000', bairro: 'Pinheiros', cidade: 'São Paulo', estado: 'SP' },
    alergias: [],
    medicamentos: [{ nome: 'OMEPRAZOL', dose: '20MG', frequencia: '1X EM JEJUM' }],
  },
  {
    cpf: '51739068077',
    nomeCompleto: 'Eduardo Pinto Rocha',
    dataNascimento: '1992-07-07',
    sexoBiologico: 'MASCULINO',
    tipoSanguineo: 'O_NEGATIVO',
    convenio: null,
    nomeMae: 'Marta Rocha',
    profissao: 'Programador',
    telefone: '11854321098',
    endereco: { cep: '04571010', logradouro: 'Av. Eng. Luís Carlos Berrini', numero: '500', bairro: 'Brooklin', cidade: 'São Paulo', estado: 'SP' },
    alergias: [],
    medicamentos: [],
  },
  {
    cpf: '62840179088',
    nomeCompleto: 'Silvia Regina Teixeira',
    dataNascimento: '1965-11-19',
    sexoBiologico: 'FEMININO',
    tipoSanguineo: 'A_NEGATIVO',
    convenio: 'SUS',
    nomeMae: 'Regina Teixeira',
    profissao: 'Auxiliar de limpeza',
    telefone: '11843210987',
    endereco: { cep: '03308050', logradouro: 'Rua Taquari', numero: '150', bairro: 'Tatuapé', cidade: 'São Paulo', estado: 'SP' },
    alergias: [{ descricao: 'POLEN', gravidade: 'Leve' }],
    medicamentos: [{ nome: 'BUDESONIDA', dose: '200MCG', frequencia: '2X AO DIA' }],
  },
  {
    cpf: '73951280099',
    nomeCompleto: 'Felipe Augusto Moura',
    dataNascimento: '2005-01-02',
    sexoBiologico: 'MASCULINO',
    tipoSanguineo: 'O_POSITIVO',
    convenio: 'SUS',
    nomeMae: 'Adriana Moura',
    profissao: 'Estudante',
    telefone: '11832109876',
    endereco: { cep: '02265000', logradouro: 'Av. Águas de São Pedro', numero: '45', bairro: 'Tucuruvi', cidade: 'São Paulo', estado: 'SP' },
    alergias: [],
    medicamentos: [],
  },
  {
    cpf: '84062391000',
    nomeCompleto: 'Renata Oliveira Cavalcanti',
    dataNascimento: '1987-04-15',
    sexoBiologico: 'FEMININO',
    tipoSanguineo: 'AB_NEGATIVO',
    convenio: 'Porto Seguro',
    nomeMae: 'Olívia Cavalcanti',
    profissao: 'Farmacêutica',
    telefone: '11821098765',
    endereco: { cep: '05615070', logradouro: 'Av. Giovanni Gronchi', numero: '3200', bairro: 'Morumbi', cidade: 'São Paulo', estado: 'SP' },
    alergias: [],
    medicamentos: [],
  },
  {
    cpf: '95173402011',
    nomeCompleto: 'Geraldo Francisco Dias',
    dataNascimento: '1950-06-30',
    sexoBiologico: 'MASCULINO',
    tipoSanguineo: 'A_POSITIVO',
    convenio: 'SUS',
    nomeMae: 'Francisca Dias',
    profissao: 'Aposentado',
    telefone: '11810987654',
    endereco: { cep: '02309000', logradouro: 'Av. Nova Cantareira', numero: '1800', bairro: 'Tucuruvi', cidade: 'São Paulo', estado: 'SP' },
    alergias: [{ descricao: 'MORFINA', gravidade: 'Grave' }],
    medicamentos: [{ nome: 'WARFARINA', dose: '5MG', frequencia: 'CONFORME INR' }],
  },
  {
    cpf: '16284513022',
    nomeCompleto: 'Vanessa Lima Cardoso',
    dataNascimento: '1993-09-09',
    sexoBiologico: 'FEMININO',
    tipoSanguineo: 'B_NEGATIVO',
    convenio: null,
    nomeMae: 'Vera Cardoso',
    profissao: 'Recepcionista',
    telefone: '11809876543',
    endereco: { cep: '03401000', logradouro: 'Av. Cel. Sezefredo Fagundes', numero: '800', bairro: 'Vila Carrão', cidade: 'São Paulo', estado: 'SP' },
    alergias: [],
    medicamentos: [],
  },
  {
    cpf: '27395624033',
    nomeCompleto: 'Paulo Sergio Monteiro',
    dataNascimento: '1975-12-12',
    sexoBiologico: 'MASCULINO',
    tipoSanguineo: 'O_POSITIVO',
    convenio: 'SUS',
    nomeMae: 'Sonia Monteiro',
    profissao: 'Eletricista',
    telefone: '11798765432',
    endereco: { cep: '04286000', logradouro: 'Av. do Cursino', numero: '1200', bairro: 'Cursino', cidade: 'São Paulo', estado: 'SP' },
    alergias: [{ descricao: 'ASPIRINA', gravidade: 'Moderada' }],
    medicamentos: [],
  },
  {
    cpf: '38406735044',
    nomeCompleto: 'Amanda Cristina Freitas',
    dataNascimento: '2000-02-28',
    sexoBiologico: 'FEMININO',
    tipoSanguineo: 'A_POSITIVO',
    convenio: 'SUS',
    nomeMae: 'Cristina Freitas',
    profissao: 'Estagiária',
    telefone: '11787654321',
    endereco: { cep: '04635000', logradouro: 'Rua Verbo Divino', numero: '900', bairro: 'Chácara Santo Antônio', cidade: 'São Paulo', estado: 'SP' },
    alergias: [],
    medicamentos: [],
  },
  {
    cpf: '49517846055',
    nomeCompleto: 'Sérgio Luiz Azevedo',
    dataNascimento: '1968-08-21',
    sexoBiologico: 'MASCULINO',
    tipoSanguineo: 'B_POSITIVO',
    convenio: 'Golden Cross',
    nomeMae: 'Luiza Azevedo',
    profissao: 'Gerente comercial',
    telefone: '11776543210',
    endereco: { cep: '04711030', logradouro: 'Av. das Nações Unidas', numero: '14000', bairro: 'Vila Gertrudes', cidade: 'São Paulo', estado: 'SP' },
    alergias: [],
    medicamentos: [{ nome: 'ATENOLOL', dose: '50MG', frequencia: '1X AO DIA' }],
  },
  {
    cpf: '50628957066',
    nomeCompleto: 'Helena Moura Vasconcelos',
    dataNascimento: '1945-03-03',
    sexoBiologico: 'FEMININO',
    tipoSanguineo: 'O_POSITIVO',
    convenio: 'SUS',
    nomeMae: 'Moura Vasconcelos',
    profissao: 'Aposentada',
    telefone: '11765432109',
    endereco: { cep: '01222000', logradouro: 'Rua da Consolação', numero: '2000', bairro: 'Consolação', cidade: 'São Paulo', estado: 'SP' },
    alergias: [{ descricao: 'FRUTOS DO MAR', gravidade: 'Grave' }],
    medicamentos: [
      { nome: 'INSULINA NPH', dose: '20UI', frequencia: '2X AO DIA' },
      { nome: 'METFORMINA', dose: '850MG', frequencia: '2X AO DIA' },
    ],
  },
  {
    cpf: '61739068077',
    nomeCompleto: 'Bruno Henrique Lopes',
    dataNascimento: '1997-06-06',
    sexoBiologico: 'MASCULINO',
    tipoSanguineo: 'A_POSITIVO',
    convenio: null,
    nomeMae: 'Henrique Lopes',
    profissao: 'Entregador',
    telefone: '11754321098',
    endereco: { cep: '05805000', logradouro: 'Estrada de Itapecerica', numero: '4000', bairro: 'Capão Redondo', cidade: 'São Paulo', estado: 'SP' },
    alergias: [],
    medicamentos: [],
  },
  {
    cpf: '72840179088',
    nomeCompleto: 'Carla Beatriz Mendonça',
    dataNascimento: '1983-10-10',
    sexoBiologico: 'FEMININO',
    tipoSanguineo: 'AB_POSITIVO',
    convenio: 'SUS',
    nomeMae: 'Beatriz Mendonça',
    profissao: 'Fisioterapeuta',
    telefone: '11743210987',
    endereco: { cep: '06020000', logradouro: 'Av. dos Autonomistas', numero: '2500', bairro: 'Vila Yara', cidade: 'Osasco', estado: 'SP' },
    alergias: [{ descricao: 'LATEX', gravidade: 'Moderada' }],
    medicamentos: [],
  },
]

/** 25 atendimentos cobrindo todos os fluxos do sistema */
export const ATENDIMENTOS_DEMO: AtendimentoDemo[] = [
  { pacienteIdx: 0, status: 'AGUARDANDO_TRIAGEM', origemIdx: 0, setor: 'Pronto-Socorro', horasAtras: 1 },
  { pacienteIdx: 1, status: 'AGUARDANDO_TRIAGEM', origemIdx: 1, setor: 'Pronto-Socorro', horasAtras: 2 },
  { pacienteIdx: 2, status: 'EM_TRIAGEM', origemIdx: 0, setor: 'Pronto-Socorro', horasAtras: 3 },
  { pacienteIdx: 3, status: 'EM_TRIAGEM', origemIdx: 2, setor: 'Pronto-Socorro', horasAtras: 4 },
  {
    pacienteIdx: 4, status: 'AGUARDANDO_ATENDIMENTO', origemIdx: 0, setor: 'Pronto-Socorro', horasAtras: 5,
    triagem: { cor: 'AMARELO', queixa: 'CEFALEIA INTENSA HÁ 6 HORAS', categoria: 'dor', paSistolica: 140, paDiastolica: 90, fc: 88, fr: 18, spo2: 98, temp: 36.8, dor: 7 },
  },
  {
    pacienteIdx: 5, status: 'AGUARDANDO_ATENDIMENTO', origemIdx: 1, setor: 'Pronto-Socorro', horasAtras: 6,
    triagem: { cor: 'LARANJA', queixa: 'DISPNEIA E SIBILÂNCIA', categoria: 'dispneia', paSistolica: 130, paDiastolica: 85, fc: 110, fr: 28, spo2: 91, temp: 37.2, dor: 3 },
  },
  {
    pacienteIdx: 6, status: 'AGUARDANDO_ATENDIMENTO', origemIdx: 0, setor: 'Pronto-Socorro', horasAtras: 2,
    triagem: { cor: 'VERDE', queixa: 'LACERAÇÃO EM MÃO DIREITA', categoria: 'trauma', paSistolica: 120, paDiastolica: 78, fc: 76, fr: 16, spo2: 99, temp: 36.5, dor: 4 },
  },
  {
    pacienteIdx: 7, status: 'AGUARDANDO_ATENDIMENTO', origemIdx: 3, setor: 'Ambulatório', horasAtras: 8,
    triagem: { cor: 'AZUL', queixa: 'RENOVAÇÃO DE RECEITUÁRIO', categoria: 'outro', paSistolica: 118, paDiastolica: 76, fc: 72, fr: 14, spo2: 99, temp: 36.4, dor: 0 },
  },
  {
    pacienteIdx: 8, status: 'EM_ATENDIMENTO', origemIdx: 0, setor: 'Pronto-Socorro', horasAtras: 4,
    triagem: { cor: 'VERMELHO', queixa: 'DOR TORÁCICA SÚBITA COM IRRADIAÇÃO', categoria: 'dor', paSistolica: 90, paDiastolica: 60, fc: 120, fr: 24, spo2: 94, temp: 36.9, dor: 9 },
  },
  {
    pacienteIdx: 9, status: 'EM_ATENDIMENTO', origemIdx: 1, setor: 'Pronto-Socorro', horasAtras: 3,
    triagem: { cor: 'AMARELO', queixa: 'FEBRE E MIALGIA HÁ 2 DIAS', categoria: 'febre', paSistolica: 125, paDiastolica: 80, fc: 98, fr: 20, spo2: 97, temp: 38.5, dor: 5 },
  },
  {
    pacienteIdx: 10, status: 'EM_ATENDIMENTO', origemIdx: 0, setor: 'Pronto-Socorro', horasAtras: 2,
    triagem: { cor: 'LARANJA', queixa: 'VÔMITOS PERSISTENTES', categoria: 'vomito', paSistolica: 100, paDiastolica: 65, fc: 105, fr: 22, spo2: 96, temp: 37.0, dor: 6 },
  },
  {
    pacienteIdx: 11, status: 'CONCLUIDO', origemIdx: 0, setor: 'Pronto-Socorro', horasAtras: 24,
    triagem: { cor: 'VERDE', queixa: 'ENTORSE DE TORNOZELO', categoria: 'trauma', paSistolica: 122, paDiastolica: 78, fc: 80, fr: 16, spo2: 99, temp: 36.6, dor: 5 },
    prontuario: { cid: 'S93.4', cidDesc: 'Entorse e distensão do tornozelo', medicamento: 'DIPIRONA', exame: 'Raio-X tornozelo' },
  },
  {
    pacienteIdx: 12, status: 'CONCLUIDO', origemIdx: 2, setor: 'Pronto-Socorro', horasAtras: 26,
    triagem: { cor: 'AMARELO', queixa: 'DOR ABDOMINAL DIFUSA', categoria: 'dor', paSistolica: 128, paDiastolica: 82, fc: 92, fr: 18, spo2: 98, temp: 37.1, dor: 7 },
    prontuario: { cid: 'K52.9', cidDesc: 'Gastroenterite não especificada', medicamento: 'BUSCOPAN', exame: 'Hemograma completo' },
  },
  {
    pacienteIdx: 13, status: 'CONCLUIDO', origemIdx: 0, setor: 'Pronto-Socorro', horasAtras: 30,
    triagem: { cor: 'VERDE', queixa: 'CISTITE — DISÚRIA', categoria: 'outro', paSistolica: 115, paDiastolica: 75, fc: 78, fr: 16, spo2: 99, temp: 36.7, dor: 4 },
    prontuario: { cid: 'N39.0', cidDesc: 'Infecção do trato urinário', medicamento: 'CIPROFLOXACINO', exame: 'EAS / Urina tipo I' },
  },
  {
    pacienteIdx: 14, status: 'CONCLUIDO', origemIdx: 3, setor: 'Ambulatório', horasAtras: 48,
    triagem: { cor: 'AZUL', queixa: 'CONSULTA DE ROTINA — HAS', categoria: 'outro', paSistolica: 135, paDiastolica: 88, fc: 74, fr: 14, spo2: 99, temp: 36.5, dor: 0 },
    prontuario: { cid: 'I10', cidDesc: 'Hipertensão essencial', medicamento: 'LOSARTANA', exame: 'Creatinina / Ureia' },
  },
  {
    pacienteIdx: 15, status: 'CONCLUIDO', origemIdx: 0, setor: 'Pronto-Socorro', horasAtras: 36,
    triagem: { cor: 'AMARELO', queixa: 'CORTE PROFUNDO EM ANTEBRAÇO', categoria: 'sangramento', paSistolica: 118, paDiastolica: 72, fc: 95, fr: 18, spo2: 98, temp: 36.8, dor: 6 },
    prontuario: { cid: 'S51.0', cidDesc: 'Ferimento do antebraço', medicamento: 'AMOXICILINA', exame: 'Raio-X antebraço' },
  },
  {
    pacienteIdx: 16, status: 'CONCLUIDO', origemIdx: 1, setor: 'Pronto-Socorro', horasAtras: 40,
    triagem: { cor: 'LARANJA', queixa: 'REBAIXAMENTO DO NÍVEL DE CONSCIÊNCIA', categoria: 'alteracao_consciencia', paSistolica: 160, paDiastolica: 100, fc: 58, fr: 12, spo2: 95, temp: 36.2, dor: 0 },
    prontuario: { cid: 'I63.9', cidDesc: 'Infarto cerebral', medicamento: 'MANITOL', exame: 'TC crânio' },
  },
  {
    pacienteIdx: 17, status: 'CONCLUIDO', origemIdx: 0, setor: 'Pronto-Socorro', horasAtras: 52,
    triagem: { cor: 'VERDE', queixa: 'FEBRE E TOSSE PRODUTIVA', categoria: 'febre', paSistolica: 120, paDiastolica: 78, fc: 88, fr: 20, spo2: 97, temp: 38.2, dor: 2 },
    prontuario: { cid: 'J18.9', cidDesc: 'Pneumonia não especificada', medicamento: 'AZITROMICINA', exame: 'Raio-X tórax PA' },
  },
  {
    pacienteIdx: 18, status: 'ALTA', origemIdx: 0, setor: 'Pronto-Socorro', horasAtras: 72,
    triagem: { cor: 'VERDE', queixa: 'CRISE DE ENXAQUECA', categoria: 'dor', paSistolica: 125, paDiastolica: 80, fc: 82, fr: 16, spo2: 99, temp: 36.6, dor: 8 },
    prontuario: { cid: 'G43.9', cidDesc: 'Enxaqueca', medicamento: 'SUMATRIPTANO', exame: 'Nenhum' },
  },
  {
    pacienteIdx: 19, status: 'ALTA', origemIdx: 2, setor: 'Pronto-Socorro', horasAtras: 80,
    triagem: { cor: 'AMARELO', queixa: 'QUEIMADURA DE 1º GRAU', categoria: 'trauma', paSistolica: 122, paDiastolica: 78, fc: 84, fr: 16, spo2: 99, temp: 36.5, dor: 5 },
    prontuario: { cid: 'T30.1', cidDesc: 'Queimadura de primeiro grau', medicamento: 'DIPIRONA', exame: 'Curativo local' },
  },
  {
    pacienteIdx: 20, status: 'INTERNADO', origemIdx: 1, setor: 'Emergência', horasAtras: 12,
    triagem: { cor: 'VERMELHO', queixa: 'PCR REVERTIDA — INSTABILIDADE HEMODINÂMICA', categoria: 'alteracao_consciencia', paSistolica: 85, paDiastolica: 55, fc: 130, fr: 26, spo2: 88, temp: 35.8, dor: 0 },
    prontuario: { cid: 'I46.9', cidDesc: 'Parada cardíaca', medicamento: 'ADRENALINA', exame: 'ECG 12 derivações' },
  },
  {
    pacienteIdx: 21, status: 'CONCLUIDO', origemIdx: 0, setor: 'Pronto-Socorro', horasAtras: 20,
    triagem: { cor: 'CINZA', queixa: 'OBSERVAÇÃO PÓS-PROCEDIMENTO', categoria: 'outro', paSistolica: 118, paDiastolica: 76, fc: 70, fr: 14, spo2: 99, temp: 36.4, dor: 1 },
    prontuario: { cid: 'Z09', cidDesc: 'Seguimento pós-tratamento', medicamento: 'PARACETAMOL', exame: 'Observação clínica' },
  },
  {
    pacienteIdx: 22, status: 'AGUARDANDO_ATENDIMENTO', origemIdx: 4, setor: 'Pronto-Socorro', horasAtras: 1,
    triagem: { cor: 'LARANJA', queixa: 'AGRESSÃO FÍSICA — TRAUMA FACIAL', categoria: 'trauma', paSistolica: 145, paDiastolica: 92, fc: 102, fr: 20, spo2: 97, temp: 36.9, dor: 8 },
  },
  {
    pacienteIdx: 23, status: 'CONCLUIDO', origemIdx: 0, setor: 'Pronto-Socorro', horasAtras: 16,
    triagem: { cor: 'VERDE', queixa: 'CORPO ESTRANHO NO OLHO', categoria: 'outro', paSistolica: 120, paDiastolica: 78, fc: 76, fr: 16, spo2: 99, temp: 36.5, dor: 3 },
    prontuario: { cid: 'T15.0', cidDesc: 'Corpo estranho na córnea', medicamento: 'TOBRAMICINA COLÍRIO', exame: 'Exame oftalmológico' },
  },
  {
    pacienteIdx: 24, status: 'CONCLUIDO', origemIdx: 3, setor: 'Ambulatório', horasAtras: 60,
    triagem: { cor: 'AZUL', queixa: 'DOR LOMBAR CRÔNICA AGUDIZADA', categoria: 'dor', paSistolica: 128, paDiastolica: 84, fc: 80, fr: 16, spo2: 99, temp: 36.6, dor: 6 },
    prontuario: { cid: 'M54.5', cidDesc: 'Dor lombar baixa', medicamento: 'CICLOBENZAPRINA', exame: 'Raio-X coluna lombar' },
  },
]
