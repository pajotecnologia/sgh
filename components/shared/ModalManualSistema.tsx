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
    label: 'Prontuário Médico (PEP)',
    icone: FileText,
    itens: [
      {
        titulo: 'Consulta Médica, Anamnese, CID-10 e Prescrição (PS e Ambulatório)',
        tela: '/atendimento e /atendimento/[atendimentoId]',
        resumo: 'Workspace clínico principal do médico. Permite registrar anamnese, diagnósticos CID-10, solicitar exames laboratoriais/imagem, prescrever medicamentos e procedimentos, emitir receitas e conduzir o desfecho.',
        campos: [
          { nome: 'Anamnese / HDA', obrigatorio: true, formato: 'Texto clínico detalhado', descricao: 'Histórico da doença atual, queixa principal, antecedentes e hábitos de vida.', particularidade: 'Possui salvamento automático periódico para evitar perda de dados durante o atendimento.' },
          { nome: 'Diagnósticos (CID-10)', obrigatorio: true, formato: 'Código CID ou Descrição', descricao: 'Classificação Internacional de Doenças.', particularidade: 'Suporta múltiplos diagnósticos com definição do CID principal e hipóteses secundárias.' },
          { nome: 'Prescrição de Medicamentos', obrigatorio: false, formato: 'Item do Estoque + Posologia', descricao: 'Medicamentos para uso imediato no PS ou contínuo.', particularidade: 'Verifica o estoque em tempo real e envia automaticamente à enfermagem com aprazamento.' },
          { nome: 'Prescrição de Procedimentos & Cuidados', obrigatorio: false, formato: 'Procedimento + Descrição + Insumos', descricao: 'Procedimentos médicos e de enfermagem (curativos, sondagens, nebulização, punções, etc.).', particularidade: 'Permite descrever orientações específicas de enfermagem e vincular kits de materiais/insumos da farmácia.' },
          { nome: 'Kits de Insumos Vinculados', obrigatorio: false, formato: 'Kit / Lista de Materiais', descricao: 'Pacote de insumos e descartáveis necessários para a realização do procedimento.', particularidade: 'Os materiais solicitados aparecem diretamente na tela de dispensação da farmácia para separação.' },
          { nome: 'Solicitação de Exames', obrigatorio: false, formato: 'Laboratório / Imagem / ECG', descricao: 'Pedidos de exames com indicação clínica.', particularidade: 'Gera requisição oficial e permite acompanhamento do status do laudo.' },
          { nome: 'Receita de Alta & Atestados', obrigatorio: false, formato: 'Documento Clínico Formatado', descricao: 'Receituário domiciliar e atestado médico com dias de afastamento.', particularidade: 'Calcula automaticamente a data final do atestado e gera PDF assinado com CRM.' },
          { nome: 'Encaminhamentos / Internação', obrigatorio: false, formato: 'Especialidade / Solicitação de Leito', descricao: 'Encaminhamento ambulatorial ou solicitação de internação hospitalar (AIH).', particularidade: 'Ao solicitar internação, encaminha o paciente diretamente para recepção de admissões de leitos.' },
        ],
        opcoesBotões: [
          { acao: 'Finalizar Atendimento', funcao: 'Conclui a consulta e libera o paciente com alta ou encaminhamento registrado.' },
          { acao: 'Chamar no Painel TV', funcao: 'Aciona a voz sintetizada na recepção chamando o paciente ao consultório.' },
          { acao: 'Imprimir Ficha Completa', funcao: 'Gera documento PDF oficial com todos os registros do atendimento.' },
          { acao: 'Atendimento Obstétrico (Toggle)', funcao: 'Habilita a aba de Ficha Obstétrica para pacientes do sexo feminino gestantes/puérperas.' },
        ],
        regrasNegocio: [
          'Se houver medicamentos de uso imediato no PS prescritos, o sistema aguarda a aplicação pela enfermagem e a evolução pós-medicação antes de permitir finalizar.',
          'Procedimentos com kits de materiais debitam do estoque da farmácia assim que dispensados.',
        ],
        dica: 'Para consultas de retorno ou reavaliações, use a aba "Evolução" para registrar novos achados clínicos.',
      },
      {
        titulo: 'Histórico Longitudinal do Paciente (PEP)',
        tela: '/paciente/[id]/historico ou menu Prontuário Médico',
        resumo: 'Linha do tempo clínica completa e unificada contendo todos os atendimentos, internações, diagnósticos, exames e prescrições já realizados pelo paciente.',
        campos: [
          { nome: 'Linha do Tempo Cronológica', obrigatorio: false, formato: 'Timeline ordenada por data', descricao: 'Visão histórica consolidada de todos os episódios de cuidado.', particularidade: 'Abre em página limpa e dedicada, sem menus redundantes, maximizando a área de leitura médica.' },
          { nome: 'Filtro por Tipo de Evento', obrigatorio: false, formato: 'Consultas, Internações, Exames, Prescrições', descricao: 'Segmentação do histórico clínico.', particularidade: 'Permite ao médico localizar rapidamente resultados de exames antigos ou internações prévias.' },
        ],
        opcoesBotões: [
          { acao: 'Imprimir Histórico Consolidado', funcao: 'Gera relatório PDF completo do prontuário longitudinal do paciente.' },
          { acao: 'Abrir Atendimento Específico', funcao: 'Permite visualizar os detalhes e documentos de uma consulta anterior.' },
        ],
        regrasNegocio: [
          'Registros passados são estritamente imutáveis para garantir conformidade ética e jurídica (CFM).',
        ],
        dica: 'Consulte o histórico longitudinal antes de iniciar consultas de pacientes crônicos ou com múltiplas passagens.',
      },
      {
        titulo: 'Ficha Obstétrica & Acompanhamento da Gestante',
        tela: '/atendimento/[atendimentoId]?aba=INTERNACAO_OBSTETRICA e /prontuario/[atendimentoId]',
        resumo: 'Ficha clínica especializada para gestantes e puérperas, registrando dados de pré-natal, trabalho de parto, dilatação, dinâmica uterina, BCF e puerpério.',
        campos: [
          { nome: 'Atenção Médica / Obstétrica', obrigatorio: false, formato: 'Gesta / Para / Abortos / DUM / DPP / IG', descricao: 'Histórico obstétrico completo da gestante.', particularidade: 'Acessível e editável em todas as fases do atendimento (PS, Triagem e Internação).' },
          { nome: 'Trabalho de Parto & Dinâmica', obrigatorio: false, formato: 'Hora / Dilatação (cm) / Contrações / BCF (bpm)', descricao: 'Partograma e monitoramento fetal contínuo.', particularidade: 'Permite adicionar múltiplas linhas de evolução cronológica do parto.' },
          { nome: 'Puerpério & Recém-Nascido', obrigatorio: false, formato: 'Apgar / Peso / Sexo / Sangramento / Lóquios', descricao: 'Acompanhamento pós-parto da mãe e do concepto.', particularidade: 'Integra dados diretamente com o módulo de Berçário neonatal.' },
        ],
        opcoesBotões: [
          { acao: 'Salvar Ficha Obstétrica', funcao: 'Grava todos os parâmetros clínicos obstétricos no prontuário.' },
          { acao: 'Adicionar Linha de Trabalho de Parto', funcao: 'Insere novo registro de dilatação, contrações e BCF.' },
        ],
        regrasNegocio: [
          'Disponível exclusivamente para pacientes identificadas com sexo biológico feminino com a flag obstétrica ativa.',
        ],
        dica: 'Ao ativar a flag obstétrica na recepção ou triagem, a aba "Ficha Obstétrica" surge instantaneamente em todas as telas.',
      },
    ],
  },
  {
    id: 'farmacia',
    label: 'Farmácia & Dispensação',
    icone: Pill,
    itens: [
      {
        titulo: 'Gestão de Estoque, Entradas NFe (XML), Lotes e Validades',
        tela: '/farmacia, /farmacia/entradas, /farmacia/medicamentos e /farmacia/sinonimos',
        resumo: 'Controle de estoque farmacêutico, importação automática de NFe por XML, gestão de lotes com validade, estoque de segurança e cadastro de fornecedores.',
        campos: [
          { nome: 'Medicamento / Princípio Ativo (DCB)', obrigatorio: true, formato: 'Texto oficial', descricao: 'Identificação farmacológica do item.', particularidade: 'Permite associar múltiplos nomes comerciais através do módulo de Sinônimos.' },
          { nome: 'Lote e Data de Validade', obrigatorio: true, formato: 'Alfanumérico + Data', descricao: 'Rastreabilidade de fabricação e validade.', particularidade: 'Alerta produtos próximos do vencimento (90 dias) e bloqueia itens vencidos.' },
          { nome: 'Estoque Mínimo / Ponto de Pedido', obrigatorio: true, formato: 'Número inteiro', descricao: 'Limite de segurança para reposição.', particularidade: 'Alimenta o relatório de faltantes e sugestão de compras.' },
          { nome: 'Arquivo XML da NFe', obrigatorio: false, formato: 'Upload de arquivo .xml', descricao: 'Nota Fiscal Eletrônica de compra.', particularidade: 'Cadastra automaticamente produtos, quantidades, lotes e valores unitários.' },
        ],
        opcoesBotões: [
          { acao: 'Importar XML NFe', funcao: 'Processa o arquivo fiscal e dá entrada instantânea nos lotes de estoque.' },
          { acao: 'Nova Saída Manual', funcao: 'Registra baixas por avaria, vencimento, descarte ou transferência.' },
          { acao: 'Gerenciar Sinônimos', funcao: 'Vincula nomes de marcas ao medicamento genérico principal.' },
        ],
        regrasNegocio: [
          'A dispensação respeita a regra PEPS/FEFO (Primeiro que Vence é o Primeiro que Sai).',
        ],
        dica: 'Importe sempre o XML da NFe para garantir rastreabilidade exata de números de lote.',
      },
      {
        titulo: 'Dispensação de Medicamentos, Procedimentos e Kits de Insumos',
        tela: '/farmacia/dispensacao e /farmacia/pedidos',
        resumo: 'Central de atendimento aos pedidos da equipe de enfermagem e prescrições médicas de PS e Enfermaria.',
        campos: [
          { nome: 'Prescrições de Medicamentos', obrigatorio: true, formato: 'Lista de Medicamentos + Doses', descricao: 'Fármacos solicitados pelo médico.', particularidade: 'Exibe o status de dispensação e permite separação por lote.' },
          { nome: 'Materiais de Procedimentos & Kits', obrigatorio: false, formato: 'Lista de Insumos / Kits', descricao: 'Descartáveis e insumos requisitados para procedimentos.', particularidade: 'Exibe detalhadamente cada material que compõe o kit do procedimento solicitado.' },
          { nome: 'Profissional Solicitante / Leito', obrigatorio: true, formato: 'Identificação', descricao: 'Origem da requisição (PS, Enfermaria, Bloco Cirúrgico).', particularidade: 'Facilita a entrega e o controle de destino dos insumos.' },
        ],
        opcoesBotões: [
          { acao: 'Dispensar Pedido Completo', funcao: 'Realiza a baixa automática de todos os medicamentos e materiais no estoque.' },
          { acao: 'Imprimir Comprovante de Dispensação', funcao: 'Gera documento de entrega assinado para a enfermagem.' },
        ],
        regrasNegocio: [
          'Medicamentos ou materiais sem saldo disponível são sinalizados em vermelho na lista para providência de substituição.',
        ],
        dica: 'A farmácia pode visualizar todos os insumos vinculados aos procedimentos prescritos pelo médico em uma única tela.',
      },
    ],
  },
  {
    id: 'internamento',
    label: 'Internamento & Hospitalização',
    icone: Bed,
    itens: [
      {
        titulo: 'Mapa de Leitos, Admissões e Prontuário de Internação',
        tela: '/internamento/admissoes, /internamento/admitir, /prontuario/[id] e /evolucoes/[id]',
        resumo: 'Gestão de ocupação hospitalar, alocação de leitos em enfermarias/UTI, evolução multiprofissional, sinais vitais, SAE, CCIH e laudo AIH.',
        campos: [
          { nome: 'Mapa e Status de Leitos', obrigatorio: true, formato: 'Visual (Verde, Vermelho, Amarelo)', descricao: 'Status físico de cada leito (Livre, Ocupado, Higienização, Interditado).', particularidade: 'Permite transferência rápida de leito com registro no prontuário.' },
          { nome: 'Evolução Diurna / Noturna (Enfermagem)', obrigatorio: true, formato: 'Texto + Sistemas', descricao: 'Registro de enfermagem por plantão (Diurno / Noturno).', particularidade: 'Mede parâmetros de infusão, diurese, dor e estado geral.' },
          { nome: 'Sinais Vitais e Balanço Hídrico', obrigatorio: false, formato: 'Gráfico e Tabelas de Monitoramento', descricao: 'Aferições periódicas de PA, FC, FR, Temp, SpO2, Glicemia e Balanço Hídrico.', particularidade: 'Calcula automaticamente o balanço hídrico acumulado do dia.' },
          { nome: 'Ficha de CCIH e Infecção Hospitalar', obrigatorio: false, formato: 'Critérios ANVISA', descricao: 'Controle de infecções, uso de antimicrobianos e dispositivos invasivos (CVC, SVD, TOT).', particularidade: 'Alimenta indicadores de controle de infecção hospitalar.' },
          { nome: 'SAE (Sistematização da Assistência de Enfermagem)', obrigatorio: false, formato: 'Diagnósticos NANDA / Intervenções NIC', descricao: 'Planejamento do cuidado de enfermagem.', particularidade: 'Estrutura o plano de cuidados individualizado do paciente.' },
          { nome: 'Medicação Berçário', obrigatorio: false, formato: 'Acompanhamento Neonatal', descricao: 'Prescrições e cuidados específicos para o recém-nascido na maternidade.', particularidade: 'Exibido para pacientes obstétricas internadas.' },
        ],
        opcoesBotões: [
          { acao: 'Admitir no Leito', funcao: 'Efetiva a entrada do paciente no leito designado.' },
          { acao: 'Transferir Leito', funcao: 'Aloca o paciente em outro leito mantendo todo o histórico.' },
          { acao: 'Imprimir Laudo AIH', funcao: 'Gera o laudo de solicitação de internação hospitalar para o SUS.' },
        ],
        regrasNegocio: [
          'A liberação do leito após alta médica exige confirmação de higienização antes de nova admissão.',
        ],
        dica: 'Utilize o modo Prontuário para condutas médicas e o modo Evoluções para os cuidados da enfermagem.',
      },
      {
        titulo: 'Condições de Alta & Encerramento Hospitalar (Prontuário Médico)',
        tela: '/prontuario/[atendimentoId]?aba=CONDICOES_ALTA',
        resumo: 'Aba exclusiva do médico e da diretoria clínica para avaliação das condições de saída, registro de desfecho clínico, diagnóstico definitivo e concessão oficial de alta.',
        campos: [
          { nome: 'Condições de Alta', obrigatorio: true, formato: 'Curado / Melhorado / Internado / Piorado', descricao: 'Estado clínico do paciente no momento da liberação.', particularidade: 'Exclusivo do perfil médico — usuários de enfermagem visualizam em modo somente-leitura.' },
          { nome: 'Registro de Óbito', obrigatorio: false, formato: 'Data + Hora + (+/- 48 horas)', descricao: 'Registro epidemiológico em casos de falecimento.', particularidade: 'Controla óbitos com menos ou mais de 48h de internação para indicadores hospitalares.' },
          { nome: 'Motivo da Alta', obrigatorio: true, formato: 'Decisão médica / Alta pedida / Transferência / Indisciplina', descricao: 'Fundamentação do desfecho.', particularidade: 'Em casos de transferência, exige especificação do hospital/instituição de destino.' },
          { nome: 'Diagnóstico Definitivo (CID-10)', obrigatorio: true, formato: 'Texto + Código', descricao: 'Diagnóstico final de encerramento da internação.', particularidade: 'Consolida a folha de alta hospitalar e resumo de saída.' },
          { nome: 'Médico Responsável (CRM / CREMEPE)', obrigatorio: true, formato: 'Texto / Número', descricao: 'Identificação do profissional médico que autoriza a alta.', particularidade: 'Gravado com registro imutável de auditoria.' },
        ],
        opcoesBotões: [
          { acao: 'Salvar (Rascunho / Em Andamento)', funcao: 'Salva os dados parciais das condições de alta sem encerrar a internação.' },
          { acao: 'Concluir Alta Hospitalar', funcao: 'Finaliza oficialmente a internação, liberando o leito para higienização e emitindo o sumário de alta.' },
        ],
        regrasNegocio: [
          'Apenas médicos (MEDICO), diretores clínicos (DIRETOR_CLINICO) e administradores (ADMIN) possuem permissão para salvar ou concluir as condições de alta.',
          'Enfermeiros e recepcionistas têm acesso bloqueado para conceder alta hospitalar.',
        ],
        dica: 'Preencha o diagnóstico definitivo antes de clicar em "Concluir Alta" para que o sumário saia completo.',
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
  {
    id: 'criterios-criticas',
    label: 'Critérios, Acessos & Travas',
    icone: ShieldCheck,
    itens: [
      {
        titulo: 'Matriz de Critérios de Acesso e Responsabilidade Profissional (RBAC)',
        tela: 'Controle Global em todas as rotas e APIs do SGH',
        resumo: 'Definição explícita de quem pode acessar, visualizar, prescrever, aprazar, dispensar e concluir ações clínicas e administrativas.',
        campos: [
          { nome: 'ADMIN (Administrador)', obrigatorio: true, formato: 'Acesso Irrestrito', descricao: 'Gestão total do sistema, permissões, auditoria, configurações hospitalares e faturamento.', particularidade: 'Pode gerenciar todas as tabelas e usuários do hospital.' },
          { nome: 'DIRETOR_CLINICO (Direção Médica)', obrigatorio: true, formato: 'Autoridade Médica Máxima', descricao: 'Supervisão técnica, prescrição, alta, protocolos clínicos, regulação e auditoria médica.', particularidade: 'Acesso completo a qualquer prontuário e autorização de condutas especiais.' },
          { nome: 'MEDICO (Médico Assistente)', obrigatorio: true, formato: 'Prontuário + Prescrição + Alta', descricao: 'Consultório, internação, pedidos de exames, diagnósticos CID-10 e concessão exclusiva de alta.', particularidade: 'Somente médicos e diretores clínicos podem registrar desfecho e conceder alta hospitalar.' },
          { nome: 'ENFERMEIRO (Enfermagem Superior)', obrigatorio: true, formato: 'Triagem + Evoluções + SAE + CCIH', descricao: 'Classificação de risco Manchester, SAE, balanço hídrico, admissões e aprazamentos.', particularidade: 'Estritamente bloqueado para prescrever medicamentos/procedimentos médicos ou conceder alta.' },
          { nome: 'TECNICO_ENFERMAGEM (Técnico)', obrigatorio: true, formato: 'Checagem de Doses + Sinais', descricao: 'Aplicação de medicações, checagem e aferição de sinais vitais de rotina.', particularidade: 'Acesso operacional sob supervisão do enfermeiro.' },
          { nome: 'FARMACEUTICO (Farmácia & Estoque)', obrigatorio: true, formato: 'Estoque + NFe + Dispensação', descricao: 'Entrada por XML, gestão de lotes/validades e dispensação de medicamentos e kits.', particularidade: 'Não edita prontuários nem dados clínicos de pacientes.' },
          { nome: 'RECEPCIONISTA (Recepção)', obrigatorio: true, formato: 'Cadastro + Admissão', descricao: 'Identificação de pacientes, validação de CPF/SUS e abertura de atendimentos.', particularidade: 'Sem acesso a dados clínicos sigilosos de prontuário.' },
        ],
        opcoesBotões: [
          { acao: 'Troca de Perfil de Teste (Ambiente Dev)', funcao: 'Permite alternar perfis para validação de fluxos e permissões.' },
        ],
        regrasNegocio: [
          'Ações de concessão de alta hospitalar exigem CRM ativo do profissional.',
          'Tentativas de gravação por perfis não autorizados são rejeitadas pela API com código HTTP 403 Forbidden.',
        ],
        dica: 'Cada profissional deve sempre utilizar seu próprio login individual para fins de responsabilidade ética e jurídica.',
      },
      {
        titulo: 'Relacionamentos de Dados e Fluxo Integrado entre Módulos',
        tela: 'Integração: Recepção ➔ Triagem ➔ Consultório ➔ Farmácia ➔ Internação ➔ Alta ➔ PEP',
        resumo: 'Como os dados de pacientes, atendimentos, prescrições, kits, leitos e lotes se conectam e fluem de ponta a ponta no hospital.',
        campos: [
          { nome: 'Paciente ➔ Atendimento ➔ Prontuário', obrigatorio: true, formato: 'Relacionamento 1:N e 1:1', descricao: 'O paciente possui múltiplos atendimentos; cada atendimento possui uma triagem e um prontuário.', particularidade: 'Garante o histórico longitudinal acumulativo de toda a vida do paciente no hospital.' },
          { nome: 'Prescrição de Procedimentos ➔ Kits ➔ Farmácia', obrigatorio: true, formato: 'Vinculação Automática', descricao: 'Ao prescrever um procedimento com kit, os materiais necessários são enviados à tela de dispensação.', particularidade: 'A farmácia separa o kit completo e dá baixa rastreável por lote no estoque.' },
          { nome: 'Encaminhamento de Internação ➔ Leito ➔ Prontuário', obrigatorio: true, formato: 'Admissão e Ocupação', descricao: 'A solicitação de internação gera o leito ocupado e abre as visões /prontuario e /evolucoes.', particularidade: 'Ao concluir a alta médica, o leito é liberado automaticamente para higienização.' },
        ],
        opcoesBotões: [
          { acao: 'Rastrear Histórico Completo', funcao: 'Exibe a linha do tempo desde a triagem na recepção até o sumário de alta hospitalar.' },
        ],
        regrasNegocio: [
          'Todos os dados clínicos de consultas e internações alimentam instantaneamente o Histórico Longitudinal (PEP).',
        ],
        dica: 'A vinculação de kits a procedimentos reduz em até 80% o tempo de digitação de materiais pela equipe.',
      },
      {
        titulo: 'Críticas, Travas de Integridade e Validações em Tempo Real',
        tela: 'Mecanismos de Defesa Clínica e Operacional do SGH',
        resumo: 'Travas automáticas projetadas para impedir erros de assistência, trocas de medicamentos, fraudes cadastrais e inconsistências.',
        campos: [
          { nome: 'Trava de Medicação Pendente no PS', obrigatorio: true, formato: 'Bloqueio de Finalização', descricao: 'Impede alta médica se houver doses de medicamentos para uso no PS não aplicadas.', particularidade: 'Exige confirmação da enfermagem e evolução médica pós-aplicação.' },
          { nome: 'Trava de Prontuário Encerrado', obrigatorio: true, formato: 'Imutabilidade Legal', descricao: 'Atendimentos finalizados (Alta, Óbito, Concluído) tornam-se somente-leitura.', particularidade: 'Impede alteração retroativa de condutas e prescrições médicas.' },
          { nome: 'Trava de Elegibilidade Obstétrica', obrigatorio: true, formato: 'Validação Biológica', descricao: 'Ficha obstétrica e berçário disponíveis somente para sexo biológico feminino.', particularidade: 'Previne abertura indevida de fichas obstétricas em pacientes masculinos.' },
          { nome: 'Trava de Lotes e Validades', obrigatorio: true, formato: 'Bloqueio de Dispensação', descricao: 'Medicamentos vencidos são bloqueados para prescrição e baixa.', particularidade: 'Dispensação automática segue critério PEPS/FEFO.' },
          { nome: 'Validação de CPF e Cartão SUS', obrigatorio: true, formato: 'Módulo 11 + 15 Dígitos', descricao: 'Verificação matemática de documentos oficiais.', particularidade: 'Bloqueia cadastros com dígitos verificadores incorretos.' },
          { nome: 'Trava de Leitos (Dupla Ocupação e Higienização)', obrigatorio: true, formato: 'Status de Leito', descricao: 'Impede admitir em leito ocupado ou antes da confirmação de higienização.', particularidade: 'Garante o controle de infecção hospitalar (CCIH).' },
        ],
        opcoesBotões: [
          { acao: 'Consultar Auditoria', funcao: 'Exibe o log detalhado com IP, usuário, data e hora de qualquer tentativa de alteração.' },
        ],
        regrasNegocio: [
          'Nenhuma crítica pode ser burlada sem autorização explícita registrada em log de auditoria.',
        ],
        dica: 'As travas de segurança do SGH garantem conformidade com as normas do CFM, COFEN, CRF, ANVISA e Ministério da Saúde.',
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
              <div className="flex-1 mt-4 overflow-y-auto pr-2">
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
