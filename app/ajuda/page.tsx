// app/ajuda/page.tsx
// Central de Ajuda & Manual Completo do Usuário — SGH
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Search,
  UserPlus,
  Stethoscope,
  Tv,
  FileText,
  Pill,
  HeartPulse,
  BedDouble,
  AlertTriangle,
  FileCheck2,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Info,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Layers,
  Printer,
} from 'lucide-react'
import { LogoPajo } from '@/components/shared/LogoPajo'

interface CapituloManual {
  id: string
  numero: string
  titulo: string
  categoria: string
  icone: any
  cor: string
  resumo: string
  etapas: {
    passo: string
    descricao: string
    regras?: string[]
    dica?: string
  }[]
  telasRelacionadas?: { rota: string; nome: string }[]
}

const CAPITULOS: CapituloManual[] = [
  {
    id: 'visao-geral',
    numero: '01',
    titulo: 'Visão Geral & Ciclo Integrado do Paciente',
    categoria: 'Conceitos Fundamentais',
    icone: Sparkles,
    cor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    resumo:
      'O SGH é estruturado em torno da jornada clínica contínua do paciente, integrando atendimento, segurança, governança e faturamento sem silos operacionais.',
    etapas: [
      {
        passo: 'Entendendo a Jornada Contínua',
        descricao:
          'O fluxo operacional segue uma ordem lógica obrigatória: Recepção → Triagem Manchester → Chamada no Painel → Consultório Médico (Prescrição/Exames) → Farmácia (Dispensação FEFO) → Enfermagem (5 Certos) → Mapa de Leitos (Internação) → Evoluções Multidisciplinares → Alta / PEP Longitudinal.',
        regras: [
          'Todos os dados clínicos são criptografados com chave AES-256 em repouso.',
          'Nenhum paciente pode ser atendido pelo médico sem prévia triagem Manchester.',
          'Prescrições de medicamentos passam obrigatoriamente pela validação dos 5 Certos pela enfermagem.',
        ],
        dica: 'Utilize o menu lateral ou a Central de Pendências no Dashboard para acompanhar itens que exigem sua ação imediata.',
      },
      {
        passo: 'Perfis de Usuário & Controle de Acesso (RBAC)',
        descricao:
          'O sistema restringe telas e ações conforme o perfil profissional cadastrado: Administrador (acesso total), Médico (atendimento, anamnese, prescrição e alta), Enfermeiro (triagem, aprazamento, aplicação e SAE), Técnico de Enfermagem (aplicação e sinais vitais), Farmacêutico (dispensação e estoque), Recepcionista (cadastro e acolhimento) e Diretor Clínico (auditoria e relatórios).',
      },
    ],
    telasRelacionadas: [
      { rota: '/dashboard', nome: 'Dashboard Geral' },
      { rota: '/login', nome: 'Tela de Login' },
    ],
  },
  {
    id: 'recepcao',
    numero: '02',
    titulo: 'Recepção & Cadastro de Pacientes',
    categoria: 'Porta de Entrada',
    icone: UserPlus,
    cor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    resumo:
      'Cadastro ágil, consulta por CPF ou Cartão SUS, autopreenchimento de endereço via CEP e entrada imediata na fila de triagem.',
    etapas: [
      {
        passo: '1. Localizar ou Criar Novo Paciente',
        descricao:
          'Acesse /recepcao e digite o CPF ou número do Cartão SUS no campo de busca rápida. Caso o paciente já possua histórico na instituição, selecione "Novo Atendimento". Se for primeira vez, clique em "Novo Paciente".',
        regras: [
          'O CPF é validado pelos dígitos verificadores oficiais.',
          'Em casos de emergência sem identificação, utilize o modo "Paciente Não Identificado (Desconhecido)".',
        ],
        dica: 'Ao digitar o CEP no formulário de endereço, os campos de Rua, Bairro, Cidade e UF são preenchidos automaticamente.',
      },
      {
        passo: '2. Preenchimento de Dados & Convênio',
        descricao:
          'Informe nome completo, data de nascimento (a idade é calculada automaticamente, destacando pacientes idosos ou pediátricos), sexo biológico, tipo sanguíneo, telefone de contato e convênio (SUS, Particular ou Convênio de Saúde).',
      },
      {
        passo: '3. Abertura do Atendimento & Encaminhamento',
        descricao:
          'Clique em "Salvar e Enviar para Triagem". O sistema gera o Número de Atendimento único e o paciente é inserido em tempo real na fila da equipe de enfermagem.',
      },
    ],
    telasRelacionadas: [
      { rota: '/recepcao', nome: 'Fila de Recepção' },
      { rota: '/recepcao/novo', nome: 'Novo Cadastro' },
    ],
  },
  {
    id: 'triagem',
    numero: '03',
    titulo: 'Triagem & Protocolo de Manchester',
    categoria: 'Classificação de Risco',
    icone: Stethoscope,
    cor: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    resumo:
      'Classificação clínica por gravidade em 5 níveis de cores com cronômetro de tempo máximo de espera e coleta de sinais vitais.',
    etapas: [
      {
        passo: '1. Acolhimento e Aferição dos Sinais Vitais',
        descricao:
          'Na tela /triagem, selecione o paciente na fila de espera. Meça e registre: Pressão Arterial (PAS/PAD), Frequência Cardíaca (BPM), Frequência Respiratória, Saturação de O2 (SpO2), Temperatura (°C), Glicemia Capilar e Escala de Dor (0 a 10).',
        regras: [
          'Alertas visuais vermelhos disparam automaticamente se PA ≥ 180/110 mmHg ou SpO2 < 92%.',
          'A gravidade define a prioridade na fila de chamada do médico.',
        ],
      },
      {
        passo: '2. Definição da Cor de Manchester',
        descricao:
          'Selecione a classificação correspondente: 🔴 Vermelho (Emergência — Imediato 0 min), 🟠 Laranja (Muito Urgente — até 10 min), 🟡 Amarelo (Urgente — até 30 min), 🟢 Verde (Pouco Urgente — até 60 min) ou 🔵 Azul (Não Urgente — até 120 min).',
        dica: 'O sistema avisa visualmente caso o tempo de espera do paciente ultrapasse o limite de sua cor.',
      },
      {
        passo: '3. Finalização e Impressão da Pulseira',
        descricao:
          'Clique em "Finalizar Classificação". O paciente é movido para a fila de espera do médico e a pulseira de identificação hospitalar com código de barras/QR Code é gerada.',
      },
    ],
    telasRelacionadas: [
      { rota: '/triagem', nome: 'Fila de Triagem' },
      { rota: '/painel', nome: 'Painel de Chamada' },
    ],
  },
  {
    id: 'painel',
    numero: '04',
    titulo: 'Painel de Chamada & TV de Espera',
    categoria: 'Comunicação Visual',
    icone: Tv,
    cor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    resumo:
      'Chamada multimídia de pacientes na sala de espera com síntese de voz automática, cor Manchester e suporte a múltiplos televisores.',
    etapas: [
      {
        passo: '1. Acionando a Chamada pelo Consultório',
        descricao:
          'O médico ou enfermeiro clica em "Chamar Paciente" informando a Sala/Consultório de destino. Instantaneamente o painel na sala de espera pisca e anuncia o nome do paciente com voz sintetizada.',
      },
      {
        passo: '2. Configuração do Painel (/painel/config)',
        descricao:
          'É possível personalizar cores institucionais, mensagem de áudio personalizada, voz masculina/feminina, velocidade e modo tela dividida com imagens institucionais ou campanhas de saúde pública.',
      },
    ],
    telasRelacionadas: [
      { rota: '/painel', nome: 'Painel de Chamada' },
      { rota: '/configuracoes/painel', nome: 'Configurações do Painel' },
    ],
  },
  {
    id: 'medico',
    numero: '05',
    titulo: 'Atendimento Médico, Prescrição & Exames',
    categoria: 'Assistência Médica',
    icone: FileText,
    cor: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    resumo:
      'Anamnese SOAP estruturada, busca rápida de CID-10, prescrição eletrônica com checagem de alergias e requisição de exames.',
    etapas: [
      {
        passo: '1. Anamnese & Exame Físico',
        descricao:
          'Abra o atendimento em /atendimento/[id]. Preencha Queixa Principal, História da Doença Atual (HDA), Antecedentes Pessoais, Hábitos de Vida e Exame Físico por Sistemas.',
      },
      {
        passo: '2. Diagnósticos CID-10',
        descricao:
          'Digite o código ou nome da doença no campo de CID-10. O sistema autocompleta instantaneamente a descrição oficial da OMS e permite indicar hipótese diagnóstica principal e secundárias.',
      },
      {
        passo: '3. Prescrição de Medicamentos',
        descricao:
          'Adicione medicamentos informando: Nome/Princípio Ativo, Dose, Via de Administração (Oral, EV, IM, SC, etc.), Frequência e Duração. Se o paciente possuir alergia cadastrada para o princípio ativo, um alerta em vermelho impede erros de prescrição.',
        regras: [
          'Prescrições marcadas como "Pronto-Socorro" são enviadas imediatamente para a fila de enfermagem.',
          'Prescrições de "Receita de Alta" geram receituário para uso domiciliar.',
        ],
      },
      {
        passo: '4. Requisição de Exames & Laudos',
        descricao:
          'Solicite exames laboratoriais ou de imagem informando a urgência e indicação clínica. Os resultados liberados pelo laboratório aparecem diretamente na timeline do paciente.',
      },
    ],
    telasRelacionadas: [
      { rota: '/atendimento', nome: 'Lista de Atendimentos' },
      { rota: '/prontuario', nome: 'Prontuário Médico' },
    ],
  },
  {
    id: 'farmacia',
    numero: '06',
    titulo: 'Farmácia Hospitalar & Controle de Estoque',
    categoria: 'Suprimentos & Farmacologia',
    icone: Pill,
    cor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    resumo:
      'Triagem de prescrições, dispensação por lote/validade (FEFO), importação de XML de NF-e e matriz de interação medicamentosa.',
    etapas: [
      {
        passo: '1. Triagem Farmacêutica',
        descricao:
          'O farmacêutico revisa as prescrições médicas na tela /farmacia/triagem, checando posologias, duplicidades e matriz de risco de interações medicamentosas.',
      },
      {
        passo: '2. Controle FEFO (First-Expired, First-Out)',
        descricao:
          'Ao registrar saídas de medicamentos, o sistema seleciona automaticamente o lote com data de vencimento mais próxima, garantindo conformidade sanitária da ANVISA.',
      },
      {
        passo: '3. Entrada por Nota Fiscal XML',
        descricao:
          'Na tela /farmacia/entradas/importar-xml, envie o arquivo XML da NF-e fornecida pelo distribuidor. Os produtos, lotes, validades e quantidades são lançados no estoque de forma automática.',
      },
    ],
    telasRelacionadas: [
      { rota: '/farmacia', nome: 'Painel da Farmácia' },
      { rota: '/farmacia/medicamentos', nome: 'Catálogo de Medicamentos' },
      { rota: '/farmacia/entradas', nome: 'Entradas de Estoque' },
    ],
  },
  {
    id: 'enfermagem',
    numero: '07',
    titulo: 'Enfermagem & Administração de Medicamentos',
    categoria: 'Segurança do Paciente',
    icone: HeartPulse,
    cor: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
    resumo:
      'Checagem obrigatória dos 5 Certos da Enfermagem, aprazamento de doses e registro à beira do leito.',
    etapas: [
      {
        passo: '1. Fila de Aplicações Pendentes',
        descricao:
          'Acesse /medicacao para visualizar a lista de pacientes com medicamentos prescritos aguardando aplicação, ordenados pelo horário previsto.',
      },
      {
        passo: '2. Validação dos 5 Certos',
        descricao:
          'Antes de registrar a aplicação, marque a checagem obrigatória: ✅ Paciente Certo, ✅ Medicamento Certo, ✅ Dose Certa, ✅ Via Certa, ✅ Horário Certo.',
        regras: [
          'O registro grava o profissional executor, dose real e horário exato com carimbo de data/hora imutável.',
          'Em caso de recusa do paciente ou suspensão médica, selecione o status correspondente justificando o motivo.',
        ],
      },
    ],
    telasRelacionadas: [
      { rota: '/medicacao', nome: 'Fila de Medicação' },
      { rota: '/evolucoes', nome: 'Evoluções de Enfermagem' },
    ],
  },
  {
    id: 'leitos',
    numero: '08',
    titulo: 'Internação Hospitalar & Mapa Visual de Leitos',
    categoria: 'Gestão de Leitos',
    icone: BedDouble,
    cor: 'text-blue-600 bg-blue-600/10 border-blue-600/20',
    resumo:
      'Painel interativo de ocupação em tempo real, transferências atômicas, bloqueio para higienização e evoluções clínicas por turno.',
    etapas: [
      {
        passo: '1. Visão Geral do Mapa de Leitos (/internamento/mapa-leitos)',
        descricao:
          'Visualize toda a capacidade instalada do hospital agrupada por Clínica e Ala. Os cartões são coloridos conforme o status: 🟢 Verde (Disponível), 🔵 Azul (Ocupado), 🟡 Âmbar (Interditado/Limpeza).',
      },
      {
        passo: '2. Admitir Paciente no Leito',
        descricao:
          'Na tela /internamento/admissoes, localize a solicitação de internação emitida pelo médico e clique em "Admitir", selecionando a ala e o leito vago desejado.',
      },
      {
        passo: '3. Transferência Segura & Bloqueio',
        descricao:
          'Clique sobre um leito ocupado no mapa para abrir o modal de ações. Selecione "Transferir Leito" para mover o paciente para outro quarto sem perda de histórico, ou "Interditar Leito" para manutenção ou desinfecção terminal.',
      },
      {
        passo: '4. Fichas de Internação (SAE, Multidisciplinar, Evolução de Turno)',
        descricao:
          'Durante a estadia, registre a Sistematização da Assistência de Enfermagem (SAE), fichas multidisciplinares (Nutrição, Fisioterapia, Psicologia) e o balanço hídrico de 24 horas.',
      },
    ],
    telasRelacionadas: [
      { rota: '/internamento/mapa-leitos', nome: 'Mapa Visual de Leitos' },
      { rota: '/internamento/admissoes', nome: 'Painel de Admissões' },
    ],
  },
  {
    id: 'pep',
    numero: '09',
    titulo: 'Prontuário Eletrônico Longitudinal (PEP)',
    categoria: 'Histórico Clínico',
    icone: FileCheck2,
    cor: 'text-teal-600 bg-teal-600/10 border-teal-600/20',
    resumo:
      'Histórico clínico unificado e perpétuo do paciente, consolidando todas as passagens, diagnósticos, exames estruturados e condutas.',
    etapas: [
      {
        passo: '1. Acessando o PEP do Paciente',
        descricao:
          'Acesse /prontuario/paciente/[id] através de qualquer atendimento, consulta ou pesquisa de pacientes. O cabeçalho exibe dados demográficos, alergias conhecidas e medicamentos de uso contínuo.',
      },
      {
        passo: '2. Linha do Tempo Cronológica',
        descricao:
          'Todos os episódios de urgência, ambulatório e internação aparecem em ordem cronológica reversa, permitindo expandir sinais vitais, hipóteses diagnósticas, medicamentos aplicados e laudos de exames.',
      },
      {
        passo: '3. Visualização de Exames Estruturados',
        descricao:
          'Resultados de análises clínicas (como Hemograma, Bioquímica e Gasometria) são exibidos com tabela de valores de referência e sinalização automática de faixas normais, alteradas ou críticas ⚠️.',
      },
    ],
    telasRelacionadas: [
      { rota: '/prontuario', nome: 'Prontuário Geral' },
      { rota: '/recepcao', nome: 'Busca de Pacientes' },
    ],
  },
  {
    id: 'protocolos',
    numero: '10',
    titulo: 'Protocolos Clínicos, NIR & Regulação',
    categoria: 'Alta Complexidade',
    icone: AlertTriangle,
    cor: 'text-rose-600 bg-rose-600/10 border-rose-600/20',
    resumo:
      'Protocolos gerenciados de Sepse, AVC e Dor Torácica, Checklist de Cirurgia Segura da OMS e Regulação Externa de Leitos.',
    etapas: [
      {
        passo: '1. Protocolo de Sepse (qSOFA / SIRS)',
        descricao:
          'O sistema calcula a pontuação qSOFA a partir dos sinais vitais. Se score ≥ 2, emite alerta crítico da "Golden Hour" para início imediato de antibioticoterapia e hidratação venosa.',
      },
      {
        passo: '2. Protocolo de AVC & IAM',
        descricao:
          'Dispara cronômetro de janela trombolítica (≤ 4.5h) e tempo porta-ECG (≤ 10 min) para máxima sobrevida neurológica e coronariana.',
      },
      {
        passo: '3. Núcleo Interno de Regulação (NIR)',
        descricao:
          'Monitoramento de transferências para centrais reguladoras externas (CROSS, SUSfácil, CER) e controle de leitos retidos por mais de 24 horas.',
      },
    ],
    telasRelacionadas: [
      { rota: '/dashboard/operacoes', nome: 'Dashboard Operacional' },
      { rota: '/internamento/mapa-leitos', nome: 'Gestão de Leitos' },
    ],
  },
  {
    id: 'seguranca',
    numero: '11',
    titulo: 'Segurança, MFA, Auditoria & LGPD',
    categoria: 'Governança & Privacidade',
    icone: ShieldCheck,
    cor: 'text-cyan-600 bg-cyan-600/10 border-cyan-600/20',
    resumo:
      'Autenticação em dois fatores (TOTP), criptografia de dados de saúde, auditoria imutável de acessos e portal de direitos do titular LGPD.',
    etapas: [
      {
        passo: '1. Ativação do MFA / TOTP',
        descricao:
          'Em /seguranca/mfa, escaneie o QR Code em seu aplicativo autenticador (Google Authenticator, Microsoft Authenticator) para exigir código de 6 dígitos em cada login.',
      },
      {
        passo: '2. Gestão de Sessões Ativas (/seguranca/sessoes)',
        descricao:
          'Visualize todos os navegadores e dispositivos conectados com sua conta, com opção de encerrar sessões remotas com 1 clique.',
      },
      {
        passo: '3. Auditoria & Conformidade LGPD',
        descricao:
          'Toda visualização de prontuário, edição de dados e exportação de relatórios é registrada em log de auditoria imutável para rastreabilidade jurídica.',
      },
    ],
    telasRelacionadas: [
      { rota: '/seguranca/mfa', nome: 'Configurar MFA' },
      { rota: '/seguranca/sessoes', nome: 'Sessões Ativas' },
      { rota: '/governanca/lgpd', nome: 'Portal LGPD' },
    ],
  },
]

export default function PaginaAjudaManual() {
  const [busca, setBusca] = useState('')
  const [capituloAtivo, setCapituloAtivo] = useState(CAPITULOS[0].id)

  const termo = busca.toLowerCase().trim()

  const capitulosFiltrados = CAPITULOS.filter((c) => {
    if (!termo) return true
    return (
      c.titulo.toLowerCase().includes(termo) ||
      c.resumo.toLowerCase().includes(termo) ||
      c.categoria.toLowerCase().includes(termo) ||
      c.etapas.some(
        (e) =>
          e.passo.toLowerCase().includes(termo) ||
          e.descricao.toLowerCase().includes(termo)
      )
    )
  })

  const capAtual =
    CAPITULOS.find((c) => c.id === capituloAtivo) || capitulosFiltrados[0] || CAPITULOS[0]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Barra de Navegação Superior */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar ao Sistema</span>
          </Link>
          <div className="h-4 w-[1px] bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm sm:text-base tracking-tight text-foreground">
              Manual do Usuário & Central de Ajuda
            </span>
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20">
              v2.5.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Imprimir Manual"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir</span>
          </button>
          <LogoPajo className="hover:opacity-100 transition-opacity" />
        </div>
      </header>

      {/* Hero & Campo de Busca */}
      <div className="border-b border-border bg-gradient-to-b from-primary/5 via-background to-background py-8 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Guia Passo a Passo & Referência Operacional</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Como utilizar o SGH com máxima eficiência
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Aprenda todas as etapas sequenciais do fluxo hospitalar, desde a recepção e classificação de Manchester até o mapa de leitos, dispensação farmacêutica e prontuário longitudinal.
          </p>

          {/* Barra de Pesquisa */}
          <div className="relative max-w-xl mx-auto pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquise por termo, tela, sintoma, exame ou procedimento..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border/80 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground p-1"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Estrutura Principal de Leitura */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 grid lg:grid-cols-12 gap-8">
        {/* Sumário Sequencial Lateral (Colunas 1 a 4) */}
        <aside className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Capítulos do Manual ({capitulosFiltrados.length})
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">Ordem Clínica</span>
          </div>

          <div className="space-y-1.5 max-h-[75vh] overflow-y-auto pr-1">
            {capitulosFiltrados.map((cap) => {
              const Icon = cap.icone
              const ativo = capAtual.id === cap.id
              return (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => setCapituloAtivo(cap.id)}
                  className={`
                    w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 select-none
                    ${
                      ativo
                        ? 'bg-primary/10 border-primary/40 text-primary shadow-xs font-semibold'
                        : 'bg-card border-border/70 text-foreground hover:bg-muted/60 hover:border-border'
                    }
                  `}
                >
                  <div className={`p-2 rounded-lg border shrink-0 ${cap.cor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono opacity-70">
                        Capítulo {cap.numero}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {cap.categoria}
                      </span>
                    </div>
                    <p className="text-xs font-medium leading-tight truncate mt-0.5">
                      {cap.titulo}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Info className="h-4 w-4 text-primary" />
              <span>Precisa de Suporte Técnico?</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Em caso de dúvidas operacionais ou incidentes no plantão, contate a equipe de TI ou o Diretor Clínico da unidade.
            </p>
          </div>
        </aside>

        {/* Conteúdo Detalhado do Capítulo Selecionado (Colunas 5 a 12) */}
        <main className="lg:col-span-8 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Cabeçalho do Capítulo */}
          <div className="space-y-3 pb-6 border-b border-border">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                Capítulo {capAtual.numero}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {capAtual.categoria}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {capAtual.titulo}
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {capAtual.resumo}
            </p>

            {/* Telas Relacionadas */}
            {capAtual.telasRelacionadas && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Acessar telas:
                </span>
                {capAtual.telasRelacionadas.map((t, idx) => (
                  <Link
                    key={idx}
                    href={t.rota}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-muted/50 text-[11px] font-medium text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                  >
                    <span>{t.nome}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Etapas Passo a Passo */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>Instruções Passo a Passo</span>
            </h3>

            <div className="space-y-4">
              {capAtual.etapas.map((etapa, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-border/80 bg-background/50 space-y-3 hover:border-primary/40 transition-colors"
                >
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span>{etapa.passo}</span>
                  </h4>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-7">
                    {etapa.descricao}
                  </p>

                  {/* Regras Importantes */}
                  {etapa.regras && etapa.regras.length > 0 && (
                    <div className="pl-7 pt-1 space-y-1.5">
                      <p className="text-[11px] font-bold text-foreground uppercase tracking-wide">
                        Regras de Negócio & Segurança:
                      </p>
                      <ul className="space-y-1">
                        {etapa.regras.map((regra, rIdx) => (
                          <li
                            key={rIdx}
                            className="text-xs text-muted-foreground flex items-start gap-2"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{regra}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Dica Prática */}
                  {etapa.dica && (
                    <div className="ml-7 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Dica do Sistema:</strong> {etapa.dica}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Navegação entre capítulos (Anterior / Próximo) */}
          <div className="pt-6 border-t border-border flex items-center justify-between gap-4">
            {(() => {
              const curIndex = CAPITULOS.findIndex((c) => c.id === capAtual.id)
              const prev = CAPITULOS[curIndex - 1]
              const next = CAPITULOS[curIndex + 1]

              return (
                <>
                  {prev ? (
                    <button
                      type="button"
                      onClick={() => setCapituloAtivo(prev.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Capítulo Anterior</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {next ? (
                    <button
                      type="button"
                      onClick={() => setCapituloAtivo(next.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
                    >
                      <span>Próximo Capítulo</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
                    >
                      <span>Acessar o SGH</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </>
              )
            })()}
          </div>
        </main>
      </div>

      {/* Rodapé do Manual */}
      <footer className="border-t border-border bg-muted/20 py-6 px-4 sm:px-8 mt-auto text-center text-xs text-muted-foreground">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            SGH — Sistema de Gestão Hospitalar & Prontuário Eletrônico • Manual Oficial
          </span>
          <span className="font-mono text-[11px]">
            PAJO Tecnologia • Versão 2.5.0
          </span>
        </div>
      </footer>
    </div>
  )
}
