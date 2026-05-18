// =============================================================================
// Tipos TypeScript centralizados — SGH
// Mantidos em /types para uso em toda a aplicação
// =============================================================================

import type {
  Role,
  CorTriagem,
  StatusAtendimento,
  TipoSanguineo,
  SexoBiologico,
  ViaAdministracao,
  StatusPrescricaoItem,
  UrgenciaExame,
  CategoriaExame,
  TipoEncaminhamento,
} from '@prisma/client';

// Re-exportar enums do Prisma para evitar importar @prisma/client diretamente nos componentes
export type {
  Role,
  CorTriagem,
  StatusAtendimento,
  TipoSanguineo,
  SexoBiologico,
  ViaAdministracao,
  StatusPrescricaoItem,
  UrgenciaExame,
  CategoriaExame,
  TipoEncaminhamento,
};

// =============================================================================
// USUÁRIO
// =============================================================================

export interface UsuarioSessao {
  id: string;
  nome: string;
  email: string;
  role: Role;
  crm?: string | null;
  coren?: string | null;
}

// =============================================================================
// PACIENTE — MÓDULO 1
// =============================================================================

export interface DadosPessoais {
  nome: string;
  cpf: string;
  rg?: string;
  dataNascimento: Date;
  sexoBiologico: SexoBiologico;
  genero?: string;
  telefone?: string;
}

export interface DadosEndereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface DadosSaude {
  tipoSanguineo: TipoSanguineo;
  alergias: Alergia[];
  medicamentosContinuos: MedicamentoContinuo[];
  convenio?: string;
  numeroCarteirinha?: string;
}

export interface Alergia {
  descricao: string;
  gravidade?: 'Leve' | 'Moderada' | 'Grave';
}

export interface MedicamentoContinuo {
  nome: string;
  dose: string;
  frequencia: string;
  observacoes?: string;
}

export interface DocumentoUpload {
  tipo: 'RG' | 'CARTAO_CONVENIO' | 'LAUDO' | 'OUTRO';
  arquivo: File;
}

/// DTO para criação de paciente (enviado ao servidor)
export interface CriarPacienteDTO {
  dadosPessoais: DadosPessoais;
  endereco: DadosEndereco;
  dadosSaude: DadosSaude;
  observacoesIniciais?: string;
}

/// Paciente retornado pela API (dados descriptografados e prontos para exibição)
export interface PacienteDTO {
  id: string;
  nome: string;
  cpf: string; // Mascarado: ***.123.456-**
  dataNascimento: Date;
  sexoBiologico: SexoBiologico;
  genero?: string | null;
  tipoSanguineo: TipoSanguineo;
  convenio?: string | null;
  createdAt: Date;
  totalAtendimentos: number;
}

/// Resposta da API ViaCEP
export interface RespostaViaCEP {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // cidade
  uf: string;         // estado
  erro?: boolean;
}

// =============================================================================
// TRIAGEM — MÓDULO 2
// =============================================================================

/// Configuração de cada cor do Protocolo Manchester
export interface ConfiguracaoCorManchester {
  cor: CorTriagem;
  label: string;
  tempoMaximoMinutos: number | null; // null = sem prazo
  corHex: string;
  corTailwind: string;
  descricao: string;
}

export const PROTOCOLO_MANCHESTER: ConfiguracaoCorManchester[] = [
  {
    cor: 'VERMELHO',
    label: 'Emergência',
    tempoMaximoMinutos: 0,
    corHex: '#DC2626',
    corTailwind: 'bg-red-600',
    descricao: 'Atendimento imediato',
  },
  {
    cor: 'LARANJA',
    label: 'Muito Urgente',
    tempoMaximoMinutos: 10,
    corHex: '#EA580C',
    corTailwind: 'bg-orange-600',
    descricao: 'Atendimento em até 10 minutos',
  },
  {
    cor: 'AMARELO',
    label: 'Urgente',
    tempoMaximoMinutos: 30,
    corHex: '#CA8A04',
    corTailwind: 'bg-yellow-600',
    descricao: 'Atendimento em até 30 minutos',
  },
  {
    cor: 'VERDE',
    label: 'Pouco Urgente',
    tempoMaximoMinutos: 60,
    corHex: '#16A34A',
    corTailwind: 'bg-green-600',
    descricao: 'Atendimento em até 60 minutos',
  },
  {
    cor: 'AZUL',
    label: 'Não Urgente',
    tempoMaximoMinutos: 120,
    corHex: '#2563EB',
    corTailwind: 'bg-blue-600',
    descricao: 'Atendimento em até 120 minutos',
  },
  {
    cor: 'CINZA',
    label: 'Observação',
    tempoMaximoMinutos: null,
    corHex: '#6B7280',
    corTailwind: 'bg-gray-500',
    descricao: 'Aguardando — sem prazo definido',
  },
];

export interface SinaisVitaisDTO {
  paSistolica?: number;
  paDiastolica?: number;
  frequenciaCardiaca?: number;
  frequenciaResp?: number;
  spo2?: number;
  temperatura?: number;
  glicemia?: number;
  escalaDor?: number; // 0-10
  peso?: number;
  altura?: number;
  imc?: number; // Calculado automaticamente
}

export interface RegistrarTriagemDTO {
  atendimentoId: string;
  corClassificacao: CorTriagem;
  queixaPrincipal: string;
  categoriaQueixa?: string;
  sinaisVitais: SinaisVitaisDTO;
}

/// Paciente na fila de triagem (exibido em tempo real)
export interface PacienteNaFila {
  atendimentoId: string;
  numeroAtendimento: string;
  nomePaciente: string;
  corTriagem?: CorTriagem;
  entradaFila: Date;
  tempoEsperaMinutos: number;
  alertaUltrapassado: boolean; // true se tempo máximo foi excedido
}

// =============================================================================
// PAINEL DE CHAMADA — MÓDULO 3
// =============================================================================

export interface ChamadaPainelDTO {
  id: string;
  nomePaciente: string;
  numeroAtendimento: string;
  salaDestino: string;
  corTriagem?: CorTriagem;
  chamadoEm: Date;
  setorPainel: string;
}

/// Evento Pusher emitido ao chamar paciente
export interface EventoChamadaPainel {
  chamada: ChamadaPainelDTO;
  timestamp: string;
}

// =============================================================================
// PRONTUÁRIO — MÓDULOS 4 e 5
// =============================================================================

export interface ItemPrescricaoDTO {
  nomeMedicamento: string;
  dose: string;
  via: ViaAdministracao;
  frequencia: string;
  duracaoDias?: number;
  observacoes?: string;
}

export interface ChecklistCincoSertos {
  pacienteCerto: boolean;
  medicamentoCerto: boolean;
  doseCerta: boolean;
  viaCerta: boolean;
  horarioCerto: boolean;
}

/// Resultado da verificação de alergias
export interface AlertaAlergia {
  medicamento: string;
  alergiaConflitante: string;
  gravidade: 'Leve' | 'Moderada' | 'Grave';
}

// =============================================================================
// RESPOSTAS PADRONIZADAS DA API
// =============================================================================

export interface ApiSuccess<T> {
  sucesso: true;
  dados: T;
  mensagem?: string;
}

export interface ApiError {
  sucesso: false;
  erro: string;
  detalhes?: Record<string, string[]>; // Erros de validação Zod
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// =============================================================================
// PAGINAÇÃO
// =============================================================================

export interface PaginacaoParams {
  pagina?: number;
  limite?: number;
  busca?: string;
}

export interface PaginacaoResposta<T> {
  dados: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}
