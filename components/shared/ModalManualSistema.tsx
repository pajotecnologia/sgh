// components/shared/ModalManualSistema.tsx
'use client';

import { useState } from 'react';
import {
  Search,
  BookOpen,
  UserPlus,
  Stethoscope,
  FileText,
  Pill,
  Bed,
  Tv,
  ShieldCheck,
  HelpCircle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';

interface ModalManualSistemaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ItemManual {
  titulo: string;
  tela: string;
  campos?: { nome: string; descricao: string; obrigatorio?: boolean }[];
  detalhes: string[];
  dica?: string;
}

interface SecaoManual {
  id: string;
  label: string;
  icone: any;
  itens: ItemManual[];
}

const SECOES_MANUAL: SecaoManual[] = [
  {
    id: 'recepcao',
    label: 'Recepção',
    icone: UserPlus,
    itens: [
      {
        titulo: 'Cadastro e Admissão de Pacientes',
        tela: '/recepcao e /recepcao/novo',
        campos: [
          { nome: 'CPF / Cartão SUS', descricao: 'Identificador único do paciente.', obrigatorio: true },
          { nome: 'Nome Completo', descricao: 'Nome civil do paciente.', obrigatorio: true },
          { nome: 'Data de Nascimento', descricao: 'Data usada para cálculo de idade e prioridade.', obrigatorio: true },
          { nome: 'Nome da Mãe', descricao: 'Importante para cruzamento no CadSUS.', obrigatorio: true },
          { nome: 'Telefone / WhatsApp', descricao: 'Contato para envio de notificações e alertas.', obrigatorio: false },
          { nome: 'Endereço Completo', descricao: 'Logradouro, Bairro, CEP e Município.', obrigatorio: false },
        ],
        detalhes: [
          'A Recepção é a porta de entrada do hospital ou unidade de pronto atendimento.',
          'Permite pesquisar pacientes já cadastrados por CPF, Nome Completo ou Cartão SUS.',
          'Ao iniciar um novo atendimento, o paciente entra automaticamente na fila de Triagem.',
        ],
        dica: 'Utilize o filtro de busca rápida na tela principal da recepção para evitar cadastros duplicados.',
      },
    ],
  },
  {
    id: 'triagem',
    label: 'Triagem',
    icone: Stethoscope,
    itens: [
      {
        titulo: 'Classificação de Risco (Escala de Manchester)',
        tela: '/triagem',
        campos: [
          { nome: 'Pressão Arterial (PA)', descricao: 'Sistólica / Diastólica em mmHg.', obrigatorio: true },
          { nome: 'Frequência Cardíaca (FC)', descricao: 'Batimentos por minuto (bpm).', obrigatorio: true },
          { nome: 'Saturação de O₂ (SpO₂)', descricao: 'Porcentagem de oxigênio no sangue (%).', obrigatorio: true },
          { nome: 'Temperatura', descricao: 'Graus Celsius (°C).', obrigatorio: true },
          { nome: 'Glicemia Capilar', descricao: 'Glicose em mg/dL.', obrigatorio: false },
          { nome: 'Queixa Principal', descricao: 'Descrição detalhada dos sintomas relatados pelo paciente.', obrigatorio: true },
          { nome: 'Nível de Dor', descricao: 'Escala analógica visual de 0 a 10.', obrigatorio: true },
        ],
        detalhes: [
          '🔴 Vermelho (Emergência): Atendimento imediato (0 min).',
          '🟠 Laranja (Muito Urgente): Atendimento em até 10 min.',
          '🟡 Amarelo (Urgente): Atendimento em até 60 min.',
          '🟢 Verde (Pouco Urgente): Atendimento em até 120 min.',
          '🔵 Azul (Não Urgente): Atendimento em até 240 min.',
        ],
        dica: 'Após salvar a triagem, o paciente é enviado diretamente para a fila de Atendimento Médico.',
      },
    ],
  },
  {
    id: 'atendimento',
    label: 'Prontuário Médico',
    icone: FileText,
    itens: [
      {
        titulo: 'Consulta e Prescrição Médica Eletrônica',
        tela: '/atendimento e /prontuario',
        campos: [
          { nome: 'Anamnese / Histórico', descricao: 'Histórico da doença atual (HDA), antecedentes e alergias.', obrigatorio: true },
          { nome: 'Exame Físico', descricao: 'Achados clínicos do exame físico.', obrigatorio: false },
          { nome: 'Diagnóstico (CID-10)', descricao: 'Código ou descrição da hipótese diagnóstica.', obrigatorio: true },
          { nome: 'Prescrição de Medicamentos', descricao: 'Seleção do medicamento do estoque, dose, via e frequência.', obrigatorio: false },
          { nome: 'Solicitação de Exames', descricao: 'Seleção de exames laboratoriais e de imagem.', obrigatorio: false },
          { nome: 'Conduta', descricao: 'Alta hospitalar, Internação ou Encaminhamento.', obrigatorio: true },
        ],
        detalhes: [
          'Permite visualizar o histórico completo de atendimentos anteriores do paciente.',
          'Emissão formatada de Atestados Médicos, Receituários e Solicitações de Exame em PDF.',
          'Integração direta com o estoque da Farmácia para sinalizar indisponibilidade de insumos.',
        ],
        dica: 'Utilize os modelos de prescrição pré-configurados para agilizar o atendimento de casos de rotina.',
      },
    ],
  },
  {
    id: 'farmacia',
    label: 'Farmácia & Estoque',
    icone: Pill,
    itens: [
      {
        titulo: 'Gestão de Medicamentos, Lotes e Entradas',
        tela: '/farmacia, /farmacia/entradas e /farmacia/medicamentos',
        campos: [
          { nome: 'Medicamento / Princípio Ativo', descricao: 'Nome comercial e denominação comum brasileira (DCB).', obrigatorio: true },
          { nome: 'Lote e Data de Validade', descricao: 'Identificação individual do lote e vencimento.', obrigatorio: true },
          { nome: 'Importação XML (NFe)', descricao: 'Importação automática das notas fiscais dos fornecedores.', obrigatorio: false },
          { nome: 'Dispensação por Prescrição', descricao: 'Baixa automática no estoque ao atender solicitações de medicação.', obrigatorio: true },
          { nome: 'Gestão de Sinônimos', descricao: 'Associação de nomes populares a medicamentos cadastrados.', obrigatorio: false },
          { nome: 'Cadastro de Fornecedores', descricao: 'CNPJ, Razão Social e Contato do distribuidor.', obrigatorio: false },
        ],
        detalhes: [
          'Notificações de alertas para produtos perto do vencimento ou com estoque crítico/mínimo.',
          'Rastreabilidade total por número de lote e histórico de movimentações.',
          'Importação de NFe via arquivo XML agilizando o registro de entrada física de caixas e frascos.',
        ],
        dica: 'Confera o número do lote e a validade física ao confirmar a entrada por XML da NFe.',
      },
    ],
  },
  {
    id: 'internamento',
    label: 'Internamento & Enfermagem',
    icone: Bed,
    itens: [
      {
        titulo: 'Gestão de Leitos e Prontuário de Enfermagem',
        tela: '/internamento/admissoes, /internamento/admitir e /evolucoes',
        campos: [
          { nome: 'Leito / Unidade', descricao: 'Alocação do paciente na enfermaria/UTI.', obrigatorio: true },
          { nome: 'Evolução de Enfermagem', descricao: 'Registro diário do estado do paciente e cuidados prestados.', obrigatorio: true },
          { nome: 'Balanço Hídrico', descricao: 'Controle de volume de líquidos administrados e eliminados.', obrigatorio: false },
          { nome: 'Checagem de Prescrição', descricao: 'Aprazamento e checagem de horários de aplicação de medicamentos.', obrigatorio: true },
        ],
        detalhes: [
          'Mapa dinâmico de leitos mostrando unidades ocupadas, vagantes, em higienização ou manutenção.',
          'Alerta em tempo real para a equipe de enfermagem sobre novas prescrições liberadas pelo médico.',
        ],
        dica: 'O balanço hídrico realiza automaticamente o cálculo de balanço positivo ou negativo.',
      },
    ],
  },
  {
    id: 'painel',
    label: 'Medicação & Painel TV',
    icone: Tv,
    itens: [
      {
        titulo: 'Chamada de Pacientes e Fila de Medicação (PS)',
        tela: '/painel e /medicacao',
        campos: [
          { nome: 'Painel TV (Chamador)', descricao: 'Tela cheia para exibição de voz/áudio na recepção e sala de espera.', obrigatorio: false },
          { nome: 'Chamada por Som/Voz', descricao: 'Alerta sonoro sintetizado em português.', obrigatorio: false },
          { nome: 'Fila de Medicação do PS', descricao: 'Painel de administração rápida de medicação injetável/oral.', obrigatorio: true },
        ],
        detalhes: [
          'Atualização instantânea via web-sockets (Pusher) sem recarregar a página.',
          'Exibe o nome do paciente, consultório e prioridade de atendimento.',
        ],
        dica: 'No monitor/TV da recepção, clique na tela para autorizar a reprodução de áudio de chamada.',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Configurações & Segurança',
    icone: ShieldCheck,
    itens: [
      {
        titulo: 'Gestão de Usuários, RBAC e Auditoria',
        tela: '/admin, /configuracoes e /auditoria',
        campos: [
          { nome: 'Perfil de Acesso (Role)', descricao: 'ADMIN, MEDICO, ENFERMEIRO, RECEPCAO, FARMACEUTICO.', obrigatorio: true },
          { nome: 'Status do Usuário', descricao: 'Ativo ou Inativo no sistema.', obrigatorio: true },
          { nome: 'Log de Auditoria', descricao: 'Registro de cada ação executada pelos usuários.', obrigatorio: false },
        ],
        detalhes: [
          'Perfis definem exatamente quais menus e botões ficam visíveis para cada usuário.',
          'Logs de auditoria registram timestamp, IP e dados alterados.',
        ],
        dica: 'Cada profissional deve possuir seu próprio usuário individual no sistema.',
      },
    ],
  },
];

export function ModalManualSistema({ open, onOpenChange }: ModalManualSistemaProps) {
  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('recepcao');

  if (!open) return null;

  const termoBusca = busca.toLowerCase().trim();

  const secoesFiltradas = SECOES_MANUAL.map((secao) => ({
    ...secao,
    itens: secao.itens.filter((item) => {
      if (!termoBusca) return true;
      const noTitulo = item.titulo.toLowerCase().includes(termoBusca);
      const naTela = item.tela.toLowerCase().includes(termoBusca);
      const nosDetalhes = item.detalhes.some((d) => d.toLowerCase().includes(termoBusca));
      const nosCampos = item.campos?.some(
        (c) => c.nome.toLowerCase().includes(termoBusca) || c.descricao.toLowerCase().includes(termoBusca)
      );
      return noTitulo || naTela || nosDetalhes || nosCampos;
    }),
  })).filter((secao) => secao.itens.length > 0);

  const abaSelecionadaId = termoBusca ? secoesFiltradas[0]?.id : abaAtiva;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="p-5 pb-4 border-b border-border bg-muted/40 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Manual Completo do Sistema (SGH)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Guia detalhado de telas, módulos, regras de negócio e preenchimento de campos.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar manual"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Campo de Busca Rápida */}
        <div className="p-4 border-b border-border bg-background">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar por módulo, tela, campo ou instrução... (ex.: 'Manchester', 'XML', 'Prescrição')"
              className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* Conteúdo Principal com Abas */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col">
          {termoBusca && secoesFiltradas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HelpCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-foreground">Nenhum resultado encontrado para "{busca}"</p>
              <p className="text-xs mt-1">Tente pesquisar com outros termos ou limpe a busca.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Botões de Abas */}
              <div className="flex flex-wrap gap-1.5 bg-muted/60 p-1 rounded-lg border border-border shrink-0 overflow-x-auto">
                {(termoBusca ? secoesFiltradas : SECOES_MANUAL).map((secao) => {
                  const Icone = secao.icone;
                  const ativa = secao.id === abaSelecionadaId;
                  return (
                    <button
                      key={secao.id}
                      type="button"
                      onClick={() => setAbaAtiva(secao.id)}
                      className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                        ativa
                          ? 'bg-background text-foreground shadow-xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }`}
                    >
                      <Icone className="h-3.5 w-3.5" />
                      <span>{secao.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Conteúdo da Aba Ativa */}
              <div className="flex-1 mt-4 overflow-y-auto pr-2 max-h-[460px]">
                {(termoBusca ? secoesFiltradas : SECOES_MANUAL)
                  .filter((secao) => secao.id === abaSelecionadaId)
                  .map((secao) => (
                    <div key={secao.id} className="space-y-6">
                      {secao.itens.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                              {item.titulo}
                            </h3>
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-muted text-muted-foreground border border-border">
                              Rota: {item.tela}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Funcionamento & Particularidades
                            </h4>
                            <ul className="space-y-1.5 text-xs text-foreground/90">
                              {item.detalhes.map((detalhe, dIdx) => (
                                <li key={dIdx} className="flex items-start gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                  <span>{detalhe}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {item.campos && item.campos.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Detalhamento dos Campos da Tela
                              </h4>
                              <div className="rounded-lg border border-border overflow-hidden bg-background/50">
                                <table className="w-full text-xs text-left border-collapse">
                                  <thead className="bg-muted/70 text-muted-foreground font-semibold border-b border-border">
                                    <tr>
                                      <th className="p-2.5">Campo</th>
                                      <th className="p-2.5">Obrigatório</th>
                                      <th className="p-2.5">Descrição / Função</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/60">
                                    {item.campos.map((campo, cIdx) => (
                                      <tr key={cIdx} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-2.5 font-medium text-foreground">{campo.nome}</td>
                                        <td className="p-2.5">
                                          {campo.obrigatorio ? (
                                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-semibold">
                                              Sim
                                            </span>
                                          ) : (
                                            <span className="text-muted-foreground text-[11px]">Opcional</span>
                                          )}
                                        </td>
                                        <td className="p-2.5 text-muted-foreground">{campo.descricao}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {item.dica && (
                            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                              <Info className="h-4 w-4 shrink-0 mt-0.5" />
                              <div>
                                <strong className="font-semibold">Dica de uso: </strong>
                                {item.dica}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
