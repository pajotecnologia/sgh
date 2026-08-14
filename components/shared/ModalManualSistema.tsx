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
  BarChart3,
  Layers,
} from 'lucide-react';

interface ModalManualSistemaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CampoDetalhado {
  nome: string;
  obrigatorio?: boolean;
  formato?: string;
  descricao: string;
  particularidade?: string;
}

interface ItemManual {
  titulo: string;
  tela: string;
  resumo: string;
  campos?: CampoDetalhado[];
  opcoesBotões?: { acao: string; funcao: string }[];
  regrasNegocio: string[];
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
    label: 'Recepção & Pacientes',
    icone: UserPlus,
    itens: [
      {
        titulo: 'Cadastro e Admissão Completa de Paciente',
        tela: '/recepcao e /recepcao/novo',
        resumo: 'Primeira etapa do atendimento hospitalar. Permite identificar o paciente, consultar cadastros anteriores e dar entrada na fila de atendimento.',
        campos: [
          { nome: 'CPF', obrigatorio: true, formato: '000.000.000-00', descricao: 'Documento nacional de identificação.', particularidade: 'Possui validação algorítmica de dígitos verificadores para impedir números falsos.' },
          { nome: 'Cartão Nacional de Saúde (SUS)', obrigatorio: true, formato: '15 dígitos numéricos', descricao: 'Identificador do paciente no sistema único de saúde.', particularidade: 'Permite busca direta e vinculação no faturamento do SUS.' },
          { nome: 'Nome Completo', obrigatorio: true, formato: 'Texto civil', descricao: 'Nome civil oficial do paciente conforme documento.', particularidade: 'Pode ser pesquisado por qualquer parte do nome.' },
          { nome: 'Nome da Mãe', obrigatorio: true, formato: 'Texto', descricao: 'Nome completo da mãe.', particularidade: 'Fundamental para desambiguação de homônimos no CadSUS.' },
          { nome: 'Data de Nascimento', obrigatorio: true, formato: 'DD/MM/AAAA', descricao: 'Data de nascimento do paciente.', particularidade: 'Calcula automaticamente a idade exata e sinaliza pacientes idosos (≥60 anos) ou pediátricos.' },
          { nome: 'Sexo Biológico', obrigatorio: true, formato: 'Masculino / Feminino', descricao: 'Sexo registrado de nascimento.', particularidade: 'Define automaticamente as regras de exames específicos e fichas obstétricas.' },
          { nome: 'Nome Social', obrigatorio: false, formato: 'Texto', descricao: 'Nome pelo qual a pessoa prefere ser chamada.', particularidade: 'Aparece em destaque em todas as telas de chamada e pulseira.' },
          { nome: 'Telefone / WhatsApp', obrigatorio: false, formato: '(00) 00000-0000', descricao: 'Contato do paciente ou responsável.', particularidade: 'Utilizado para envio de avisos de exames e lembretes.' },
          { nome: 'CEP / Endereço', obrigatorio: false, formato: '00000-000', descricao: 'Local de residência.', particularidade: 'Ao digitar o CEP, a rua, bairro, cidade e estado são preenchidos automaticamente via ViaCEP.' },
          { nome: 'Procedência do Paciente', obrigatorio: true, formato: 'Seleção', descricao: 'Origem do paciente (Residência, Via Pública, Trabalho, Transferência).', particularidade: 'Alimenta os relatórios epidemiológicos e fichas SUS.' },
          { nome: 'Tipo de Atendimento', obrigatorio: true, formato: 'Eletivo / Urgência / Emergência', descricao: 'Caráter da entrada.', particularidade: 'Atendimentos de emergência entram no topo da fila de triagem.' },
        ],
        opcoesBotões: [
          { acao: 'Salvar e Enviar para Triagem', funcao: 'Grava o cadastro e coloca o paciente na fila de Triagem com status AGUARDANDO_TRIAGEM.' },
          { acao: 'Imprimir Ficha de Admissão', funcao: 'Gera o PDF com os dados de admissão e código do atendimento para o prontuário físico.' },
          { acao: 'Buscar por CPF / SUS', funcao: 'Localiza o cadastro pré-existente evitando duplicidades no banco.' },
        ],
        regrasNegocio: [
          'Pacientes menores de 18 anos exigem o preenchimento dos dados do Responsável Legal.',
          'Em casos de emergência grave (paciente inconsciente/sem documento), é possível abrir ficha provisória (Desconhecido).',
          'O sistema avisa se o paciente já estiver com um atendimento aberto no mesmo dia.',
        ],
        dica: 'Digite o CPF ou Cartão SUS antes de preencher os outros campos para puxar os dados existentes.',
      },
    ],
  },
  {
    id: 'triagem',
    label: 'Triagem & Manchester',
    icone: Stethoscope,
    itens: [
      {
        titulo: 'Classificação de Risco e Sinais Vitais (Escala de Manchester)',
        tela: '/triagem e /triagem/[atendimentoId]',
        resumo: 'Avaliação clínica inicial realizada pela equipe de enfermagem para mensurar a gravidade e definir o tempo máximo para atendimento médico.',
        campos: [
          { nome: 'Pressão Arterial (PA)', obrigatorio: true, formato: 'Sistólica x Diastólica (mmHg)', descricao: 'Medição da pressão arterial (ex.: 120x80).', particularidade: 'Sinaliza alertas visuais vermelhos se PA ≥ 180/110 ou PA ≤ 90/60.' },
          { nome: 'Frequência Cardíaca (FC)', obrigatorio: true, formato: 'bpm (batimentos/min)', descricao: 'Frequência do pulso arterial.', particularidade: 'Alerta para taquicardia (>100 bpm) ou bradicardia (<60 bpm).' },
          { nome: 'Frequência Respiratória (FR)', obrigatorio: false, formato: 'irpm (incursões/min)', descricao: 'Incursões respiratórias por minuto.', particularidade: 'Indica taquipneia em quadros respiratórios de emergência.' },
          { nome: 'Saturação de Oxigênio (SpO₂)', obrigatorio: true, formato: '0% a 100%', descricao: 'Porcentagem de saturação de O₂ periférico.', particularidade: 'Valores abaixo de 92% geram alerta crítico automático de hipóxia.' },
          { nome: 'Temperatura Corporal', obrigatorio: true, formato: '°C (Celsius)', descricao: 'Temperatura aferida.', particularidade: 'Valores ≥ 37.8°C indicam febre; ≥ 39°C indicam febre alta.' },
          { nome: 'Glicemia Capilar', obrigatorio: false, formato: 'mg/dL', descricao: 'Nível de glicose no sangue.', particularidade: 'Recomendado para diabéticos, idosos ou com alteração de nível de consciência.' },
          { nome: 'Escala de Dor (EVA)', obrigatorio: true, formato: '0 (Sem dor) a 10 (Insuportável)', descricao: 'Intensidade da dor relatada.', particularidade: 'Dores ≥ 8 elevam a prioridade para Amarelo ou Laranja.' },
          { nome: 'Queixa Principal / Discriminação', obrigatorio: true, formato: 'Texto livre', descricao: 'Relato dos sintomas atuais pelo paciente.', particularidade: 'Base para a escolha do fluxograma de Manchester.' },
          { nome: 'Cor da Classificação', obrigatorio: true, formato: 'Vermelho / Laranja / Amarelo / Verde / Azul', descricao: 'Nível final de prioridade.', particularidade: 'Determina a ordenação automática da fila do consultório médico.' },
          { nome: 'Destino / Consultório', obrigatorio: true, formato: 'Seleção', descricao: 'Sala para onde o paciente será direcionado.', particularidade: 'Ex.: Consultório 1, Consultório 2, Sala Vermelha, Medicação.' },
        ],
        opcoesBotões: [
          { acao: 'Finalizar Triagem', funcao: 'Salva os sinais vitais, gera o protocolo e encaminha o paciente ao painel do médico.' },
          { acao: 'Chamar Paciente na TV', funcao: 'Dispara a voz sintetizada e o aviso sonoro na TV da recepção.' },
          { acao: 'Reclassificar Paciente', funcao: 'Permite alterar a cor caso os sinais vitais piorarem durante a espera.' },
        ],
        regrasNegocio: [
          '🔴 Vermelho (Emergência): Tempo de espera 0 min. Envio imediato para a Sala Vermelha.',
          '🟠 Laranja (Muito Urgente): Tempo máximo 10 min.',
          '🟡 Amarelo (Urgente): Tempo máximo 60 min.',
          '🟢 Verde (Pouco Urgente): Tempo máximo 120 min.',
          '🔵 Azul (Não Urgente): Tempo máximo 240 min.',
        ],
        dica: 'Se a SpO₂ estiver baixa ou o paciente inconsciente, selecione Vermelho imediatamente.',
      },
    ],
  },
  {
    id: 'atendimento',
    label: 'Prontuário Médico',
    icone: FileText,
    itens: [
      {
        titulo: 'Consulta Médica, Prescrição e Diagnóstico (CID-10)',
        tela: '/atendimento e /prontuario/[atendimentoId]',
        resumo: 'Prontuário eletrônico do médico contendo anamnese, exame físico, hipótese diagnóstica, prescrição de medicamentos, pedidos de exames e emissão de documentos.',
        campos: [
          { nome: 'Anamnese / HDA', obrigatorio: true, formato: 'Texto detalhado', descricao: 'Histórico da doença atual, evolução e sintomas.', particularidade: 'Fica registrado de forma permanente e imutável no prontuário.' },
          { nome: 'Antecedentes e Alergias', obrigatorio: false, formato: 'Texto', descricao: 'Doenças prévias (HAS, DM, Asma) e alergias conhecidas.', particularidade: 'Destacado em vermelho se houver alergias medicamentosas registradas.' },
          { nome: 'Exame Físico', obrigatorio: false, formato: 'Texto', descricao: 'Achados do exame físico por aparelhos (Ausculte, Abdome, Membros).', particularidade: 'Pode ser preenchido com modelos padrão predefinidos.' },
          { nome: 'Diagnóstico Principal (CID-10)', obrigatorio: true, formato: 'Código ou Nome', descricao: 'Classificação Internacional de Doenças.', particularidade: 'Busca inteligente por código (ex: J18) ou por nome (ex: "Pneumonia").' },
          { nome: 'Medicamento da Prescrição', obrigatorio: false, formato: 'Seleção do Estoque', descricao: 'Medicamento cadastrado na farmácia.', particularidade: 'Sinaliza o saldo atual em estoque para evitar prescrever itens faltantes.' },
          { nome: 'Dose e Unidade de Medida', obrigatorio: false, formato: 'Número + Unidade', descricao: 'Quantidade a ser administrada.', particularidade: 'Ex.: 500 mg, 1 ampola, 10 ml, 1 comprimido, 250 mg/5ml.' },
          { nome: 'Via de Administração', obrigatorio: false, formato: 'ORAL, IV, IM, SC, TÓPICA, INALATÓRIA, etc.', descricao: 'Caminho de aplicação.', particularidade: 'Instrui a equipe de enfermagem sobre a técnica correta.' },
          { nome: 'Frequência / Horário', obrigatorio: false, formato: '6/6h, 8/8h, 12/12h, 24/24h, Se Necessário', descricao: 'Intervalo entre doses.', particularidade: 'Calcula o aprazamento automático no prontuário da enfermagem.' },
          { nome: 'Solicitação de Exames', obrigatorio: false, formato: 'Checklist / Seleção', descricao: 'Exames laboratoriais e de imagem.', particularidade: 'Gera pedido impresso ou encaminhamento interno para o laboratório.' },
          { nome: 'Conduta / Desfecho', obrigatorio: true, formato: 'Alta / Observação / Internação / Transferência / Óbito', descricao: 'Destino final do atendimento.', particularidade: 'Ao selecionar Internação, envia o paciente para o painel de admissões de leitos.' },
        ],
        opcoesBotões: [
          { acao: 'Carregar Modelo Padrão', funcao: 'Preenche instantaneamente a prescrição com kits pré-configurados (ex.: Modelo Dengue).' },
          { acao: 'Imprimir Receituário / Atestado', funcao: 'Gera o PDF formatado com cabeçalho oficial, assinatura e CRM.' },
          { acao: 'Finalizar Atendimento', funcao: 'Conclui a consulta médica e salva o prontuário com registro timestamp.' },
        ],
        regrasNegocio: [
          'Atestados médicos gerados calculam automaticamente a data final com base no número de dias concedidos.',
          'Prescrições de medicamentos controlados exigem preenchimento completo do receituário de controle especial.',
        ],
        dica: 'Utilize o botão "Histórico do Paciente" para ver consultas e medicamentos anteriores.',
      },
    ],
  },
  {
    id: 'farmacia',
    label: 'Farmácia & Lotes',
    icone: Pill,
    itens: [
      {
        titulo: 'Gestão de Estoque, Entradas NFe (XML), Lotes e Fornecedores',
        tela: '/farmacia, /farmacia/entradas, /farmacia/medicamentos e /farmacia/sinonimos',
        resumo: 'Módulo completo de controle farmacêutico, entradas por Nota Fiscal (XML), gestão de lotes com validade, cadastro de fornecedores e sinônimos.',
        campos: [
          { nome: 'Nome do Medicamento / Princípio Ativo', obrigatorio: true, formato: 'Texto (DCB)', descricao: 'Nome comercial e denominação comum brasileira.', particularidade: 'Permite vincular múltiplos sinônimos comerciais ao mesmo produto.' },
          { nome: 'Número do Lote', obrigatorio: true, formato: 'Alfanumérico', descricao: 'Identificador do lote de fabricação.', particularidade: 'Garante a rastreabilidade total de quais pacientes receberam cada lote.' },
          { nome: 'Data de Validade', obrigatorio: true, formato: 'MM/AAAA ou DD/MM/AAAA', descricao: 'Vencimento do lote.', particularidade: 'O sistema alerta em amarelo produtos que vencem em 90 dias e em vermelho produtos vencidos.' },
          { nome: 'Estoque Mínimo / Crítico', obrigatorio: true, formato: 'Número inteiro', descricao: 'Quantidade mínima de segurança.', particularidade: 'Gera alertas na aba de relatórios quando o saldo atual for menor que o mínimo.' },
          { nome: 'Chave NFe / Arquivo XML', obrigatorio: false, formato: '44 dígitos ou arquivo .xml', descricao: 'Nota Fiscal de Compra do fornecedor.', particularidade: 'Importa automaticamente todos os medicamentos, quantidades, lotes e preços de custo.' },
          { nome: 'CNPJ / Fornecedor', obrigatorio: false, formato: '00.000.000/0000-00', descricao: 'Distribuidor ou laboratório farmacêutico.', particularidade: 'Associa a entrada de mercadoria ao cadastro do distribuidor.' },
          { nome: 'Tipo de Saída Manual', obrigatorio: false, formato: 'Perda, Vencimento, Empréstimo, Transferência', descricao: 'Motivo da baixa direta no estoque.', particularidade: 'Registra a baixa com justificativa e responsável pela operação.' },
        ],
        opcoesBotões: [
          { acao: 'Importar XML NFe', funcao: 'Abre a tela de upload da Nota Fiscal eletrônica para dar entrada automática no estoque.' },
          { acao: 'Nova Saída Manual', funcao: 'Registra a baixa de itens por avaria, vencimento ou ajuste de inventário.' },
          { acao: 'Gerenciar Sinônimos', funcao: 'Associa nomes de marcas comerciais ao medicamento genérico principal.' },
          { acao: 'Cadastrar Fornecedor', funcao: 'Adiciona novo distribuidor com CNPJ, Razão Social e dados de contato.' },
        ],
        regrasNegocio: [
          'Produtos vencidos são bloqueados automaticamente para dispensação e prescrição.',
          'A baixa de estoque por dispensação obedece o critério PEPS (Primeiro que Vence é o Primeiro que Sai).',
        ],
        dica: 'Sempre importe a NFe via arquivo XML para economizar tempo e evitar erros de digitação de lotes.',
      },
    ],
  },
  {
    id: 'internamento',
    label: 'Internamento & Leitos',
    icone: Bed,
    itens: [
      {
        titulo: 'Mapa de Leitos, Admissões, Evoluções e Balanço Hídrico',
        tela: '/internamento/admissoes, /internamento/admitir e /evolucoes',
        resumo: 'Gestão de ocupação hospitalar, alocação de leitos em enfermarias/UTI, evolução diária da enfermagem e controle hídrico.',
        campos: [
          { nome: 'Unidade / Enfermaria / Leito', obrigatorio: true, formato: 'Seleção', descricao: 'Local físico do paciente internado.', particularidade: 'Exibe o status visual do leito (Livre = Verde, Ocupado = Vermelho, Higienização = Amarelo).' },
          { nome: 'Clínica de Internação', obrigatorio: true, formato: 'Médica, Cirúrgica, Pediátrica, Obstétrica, UTI', descricao: 'Especialidade da internação.', particularidade: 'Agrupa os relatórios de ocupação hospitalar por clínica.' },
          { nome: 'Evolução de Enfermagem', obrigatorio: true, formato: 'Texto estruturado', descricao: 'Registro do estado geral do paciente no plantão.', particularidade: 'Avalia sistemas (Neurológico, Respiratório, Circulatório, Digestivo, Renal).' },
          { nome: 'Balanço Hídrico (Ganhos)', obrigatorio: false, formato: 'Volume em mL', descricao: 'Líquidos administrados (Soros, Dietas, Medicação IV, Via Oral).', particularidade: 'Soma automaticamente todos os aportes líquidos.' },
          { nome: 'Balanço Hídrico (Perdas)', obrigatorio: false, formato: 'Volume em mL', descricao: 'Líquidos eliminados (Diurese, Drenos, Emese, Diarreia).', particularidade: 'Subtrai os valores gerando o Saldo Hídrico final (Positivo ou Negativo).' },
          { nome: 'Aprazamento de Prescrição', obrigatorio: true, formato: 'Grade de Horários', descricao: 'Marcação dos horários para administração da medicação.', particularidade: 'Permite checagem individual por dose aplicada, atrasada ou recusada.' },
        ],
        opcoesBotões: [
          { acao: 'Admitir Paciente no Leito', funcao: 'Confirma a entrada do paciente na enfermaria e atualiza o mapa de leitos.' },
          { acao: 'Registrar Checagem', funcao: 'Marca o medicamento como administrado com o registro do nome e horário do profissional.' },
          { acao: 'Imprimir Laudo de Alta', funcao: 'Gera o documento final de resumo da internação e orientações para casa.' },
        ],
        regrasNegocio: [
          'Leitos vagos após alta médica mudam automaticamente para status "Em Higienização".',
          'Medicamentos prescritos pelo médico surgem instantaneamente na tela da enfermagem.',
        ],
        dica: 'O balanço hídrico calcula automaticamente se o saldo do paciente está positivo ou negativo.',
      },
    ],
  },
  {
    id: 'painel',
    label: 'Medicação & Painel TV',
    icone: Tv,
    itens: [
      {
        titulo: 'Fila de Medicação de Emergência e Chamador por Voz na TV',
        tela: '/painel e /medicacao',
        resumo: 'Chamada de pacientes em tempo real via Pusher (WebSockets) com áudio sintetizado em português na TV da sala de espera.',
        campos: [
          { nome: 'Painel TV (Tela Cheia)', obrigatorio: false, formato: 'Exibição em Monitor/TV', descricao: 'Tela de chamada de senhas/nomes para salas de espera.', particularidade: 'Sincronização em tempo real sem precisar atualizar a página (F5).' },
          { nome: 'Voz Sintetizada (TTS)', obrigatorio: false, formato: 'Áudio em Português', descricao: 'Leitura em voz alta do nome do paciente e consultório.', particularidade: 'Reproduz mensagens como: "Paciente [Nome], dirija-se ao Consultório 1".' },
          { nome: 'Fila de Medicação (PS)', obrigatorio: true, formato: 'Lista de Aplicação', descricao: 'Pacientes aguardando medicações injetáveis ou inalação de emergência.', particularidade: 'Permite dar baixa na medicação aplicada com registro do lote.' },
        ],
        opcoesBotões: [
          { acao: 'Chamar Novamente', funcao: 'Reemite o sinal sonoro e a voz na TV para chamar o paciente desatento.' },
          { acao: 'Ativar Som da TV', funcao: 'Habilita a permissão de áudio no navegador do computador conectado à TV.' },
        ],
        regrasNegocio: [
          'A TV exibe o nome social do paciente sempre que cadastrado.',
          'Em casos de classificação Vermelho ou Laranja, o nome pisca em destaque no painel.',
        ],
        dica: 'Clique em qualquer lugar da tela da TV ao abrir o navegador para permitir a reprodução do som.',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Segurança & Configurações',
    icone: ShieldCheck,
    itens: [
      {
        titulo: 'Gestão de Usuários, Perfil de Acesso (RBAC), Auditoria e Instituição',
        tela: '/admin, /configuracoes e /auditoria',
        resumo: 'Administração geral do sistema, níveis de permissão por função profissional, logs de auditoria imutáveis e dados da instituição.',
        campos: [
          { nome: 'Perfil de Acesso (Role)', obrigatorio: true, formato: 'ADMIN, MEDICO, ENFERMEIRO, RECEPCAO, FARMACEUTICO, etc.', descricao: 'Nível de permissão do usuário.', particularidade: 'Restringe visibilidade de botões e telas aos papéis autorizados.' },
          { nome: 'Registro Profissional (CRM / COREN)', obrigatorio: false, formato: 'Número + UF', descricao: 'Número do conselho de classe.', particularidade: 'Impresso nos receituários, atestados e evoluções assinadas.' },
          { nome: 'Status do Usuário', obrigatorio: true, formato: 'Ativo / Inativo', descricao: 'Situação da conta.', particularidade: 'Usuários inativos são impedidos de fazer login imediatamente.' },
          { nome: 'Log de Auditoria', obrigatorio: false, formato: 'Histórico Imutável', descricao: 'Registro de ações realizadas no sistema.', particularidade: 'Grava Usuário, Ação (Criar/Editar/Excluir), Entidade, IP e Timestamp.' },
          { nome: 'Logomarca da Instituição', obrigatorio: false, formato: 'Imagem (PNG/JPG)', descricao: 'Brasão/Logo do hospital.', particularidade: 'Exibido nos cabeçalhos de impressões e relatórios médicos.' },
        ],
        opcoesBotões: [
          { acao: 'Cadastrar Novo Usuário', funcao: 'Cria nova conta de acesso definindo e-mail, senha e perfil.' },
          { acao: 'Salvar Configurações', funcao: 'Atualiza o CNES, IBGE, endereço da instituição e logomarca.' },
          { acao: 'Redefinir Senha', funcao: 'Envia e-mail de redefinição ou altera a senha direta do usuário.' },
        ],
        regrasNegocio: [
          'Cada profissional deve utilizar seu próprio usuário individual para fins de responsabilidade médica e legal.',
          'Logs de auditoria não podem ser alterados ou excluídos nem por administradores.',
        ],
        dica: 'Mantenha o cadastro do CNES e IBGE atualizados para a correta validação dos relatórios do SUS.',
      },
    ],
  },
  {
    id: 'relatorios',
    label: 'Relatórios & Indicadores',
    icone: BarChart3,
    itens: [
      {
        titulo: 'Relatórios Operacionais, Estoque, Atendimentos e Exportação Excel/PDF',
        tela: '/relatorios e /farmacia/relatorios',
        resumo: 'Geração de relatórios gerenciais e indicadores operacionais de atendimento, ocupação hospitalar e consumo de farmácia.',
        campos: [
          { nome: 'Filtro por Período', obrigatorio: true, formato: 'Data Inicial / Data Final', descricao: 'Intervalo das informações.', particularidade: 'Permite filtrar atendimentos por dia, mês ou ano.' },
          { nome: 'Filtro por Profissional / Médico', obrigatorio: false, formato: 'Seleção', descricao: 'Filtrar consultas por médico.', particularidade: 'Gera o quantitativo de produção por profissional.' },
          { nome: 'Filtro por Classificação de Risco', obrigatorio: false, formato: 'Cores de Manchester', descricao: 'Filtrar por gravidade.', particularidade: 'Mede a porcentagem de pacientes Vermelhos, Laranjas, Amarelos, Verdes e Azuis.' },
          { nome: 'Relatório de Estoque Mínimo / Faltantes', obrigatorio: false, formato: 'Lista de Medicamentos', descricao: 'Produtos que precisam de compra.', particularidade: 'Destaca itens com saldo zerado ou abaixo do limite de segurança.' },
        ],
        opcoesBotões: [
          { acao: 'Imprimir em PDF', funcao: 'Gera o relatório formatado para impressão oficial em folha A4.' },
          { acao: 'Exportar para Excel / Planilha', funcao: 'Baixa os dados crus para análise em planilhas eletrônicas.' },
        ],
        regrasNegocio: [
          'Relatórios de farmácia consideram as movimentações em tempo real.',
        ],
        dica: 'Utilize o filtro de período para acompanhar a produtividade mensal da sua unidade.',
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
      const noResumo = item.resumo.toLowerCase().includes(termoBusca);
      const nasRegras = item.regrasNegocio.some((d) => d.toLowerCase().includes(termoBusca));
      const nosCampos = item.campos?.some(
        (c) => c.nome.toLowerCase().includes(termoBusca) || c.descricao.toLowerCase().includes(termoBusca) || (c.particularidade && c.particularidade.toLowerCase().includes(termoBusca))
      );
      const nosBotoes = item.opcoesBotões?.some(
        (b) => b.acao.toLowerCase().includes(termoBusca) || b.funcao.toLowerCase().includes(termoBusca)
      );
      return noTitulo || naTela || noResumo || nasRegras || nosCampos || nosBotoes;
    }),
  })).filter((secao) => secao.itens.length > 0);

  const abaSelecionadaId = termoBusca ? secoesFiltradas[0]?.id : abaAtiva;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-border bg-muted/40 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                Manual Detalhado do Sistema (SGH)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dicionário completo de telas, campos, botões, validações e regras de negócio de cada módulo.
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
        <div className="p-3 sm:p-4 border-b border-border bg-background">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar por tela, campo, botão ou regra... (ex.: 'CPF', 'Manchester', 'CID-10', 'NFe', 'Lote', 'Leito', 'Pusher')"
              className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* Conteúdo Principal com Abas */}
        <div className="flex-1 overflow-hidden p-3 sm:p-5 flex flex-col">
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
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
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
              <div className="flex-1 mt-4 overflow-y-auto pr-2 max-h-[520px]">
                {(termoBusca ? secoesFiltradas : SECOES_MANUAL)
                  .filter((secao) => secao.id === abaSelecionadaId)
                  .map((secao) => (
                    <div key={secao.id} className="space-y-6">
                      {secao.itens.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 sm:p-5 rounded-xl border border-border bg-card shadow-xs space-y-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                            <div>
                              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                {item.titulo}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.resumo}</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-muted text-muted-foreground border border-border shrink-0">
                              Rota: {item.tela}
                            </span>
                          </div>

                          {/* Tabela Exaustiva dos Campos */}
                          {item.campos && item.campos.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5 text-primary" />
                                Detalhamento Específico de Cada Campo
                              </h4>
                              <div className="rounded-lg border border-border overflow-hidden bg-background/50">
                                <table className="w-full text-xs text-left border-collapse">
                                  <thead className="bg-muted/70 text-muted-foreground font-semibold border-b border-border">
                                    <tr>
                                      <th className="p-2.5">Nome do Campo</th>
                                      <th className="p-2.5">Obrigatorio?</th>
                                      <th className="p-2.5">Formato / Validação</th>
                                      <th className="p-2.5">Descrição & Função</th>
                                      <th className="p-2.5">Particularidade / Regra</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/60">
                                    {item.campos.map((campo, cIdx) => (
                                      <tr key={cIdx} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-2.5 font-semibold text-foreground whitespace-nowrap">{campo.nome}</td>
                                        <td className="p-2.5 whitespace-nowrap">
                                          {campo.obrigatorio ? (
                                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-semibold">
                                              Sim
                                            </span>
                                          ) : (
                                            <span className="text-muted-foreground text-[11px]">Opcional</span>
                                          )}
                                        </td>
                                        <td className="p-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{campo.formato ?? 'Texto'}</td>
                                        <td className="p-2.5 text-foreground/90">{campo.descricao}</td>
                                        <td className="p-2.5 text-muted-foreground italic text-[11px]">
                                          {campo.particularidade ?? '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Botões e Ações da Tela */}
                          {item.opcoesBotões && item.opcoesBotões.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Botões e Opções da Tela
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {item.opcoesBotões.map((bot, bIdx) => (
                                  <div key={bIdx} className="p-2.5 rounded-lg border border-border/80 bg-muted/20 text-xs">
                                    <span className="font-semibold text-primary block mb-0.5">{bot.acao}</span>
                                    <span className="text-muted-foreground">{bot.funcao}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Regras de Negócio e Particularidades */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Regras de Negócio & Particularidades da Tela
                            </h4>
                            <ul className="space-y-1.5 text-xs text-foreground/90">
                              {item.regrasNegocio.map((regra, rIdx) => (
                                <li key={rIdx} className="flex items-start gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                  <span>{regra}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Dica de Uso */}
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
