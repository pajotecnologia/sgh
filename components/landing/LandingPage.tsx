// components/landing/LandingPage.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Shield,
  Users,
  Stethoscope,
  ClipboardList,
  BedDouble,
  Pill,
  BarChart3,
  Monitor,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronDown,
  Layers,
  HeartPulse,
  Award,
  Zap,
  FileSpreadsheet,
  QrCode,
  Laptop,
  Check,
  Building,
  UserCheck,
  HelpCircle,
  PlayCircle
} from 'lucide-react';

export function LandingPage() {
  const [activeTab, setActiveTab] = useState<'todos' | 'clinico' | 'gestao' | 'farmacia'>('todos');
  const [activeRole, setActiveRole] = useState<'MEDICO' | 'ENFERMEIRO' | 'FARMACEUTICO' | 'RECEPCIONISTA' | 'ADMIN'>('MEDICO');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const modulos = [
    {
      id: 'recepcao',
      categoria: 'gestao',
      icone: Users,
      cor: 'from-blue-500 to-cyan-500',
      tag: 'Acolhimento & Cadastro',
      titulo: 'Recepção Inteligente',
      descricao: 'Cadastro ágil com busca instantânea de pacientes por CPF, integração de endereço via CEP, abertura de atendimentos e geração de fichas de entrada.',
      destaques: ['Busca rápida com hash seguro', 'Dados sensíveis criptografados', 'Controle de filas em tempo real']
    },
    {
      id: 'triagem',
      categoria: 'clinico',
      icone: ClipboardList,
      cor: 'from-amber-500 to-orange-500',
      tag: 'Classificação de Risco',
      titulo: 'Triagem Manchester',
      descricao: 'Protocolo oficial de Manchester estruturado em 5 cores com cálculo automatizado de IMC, registro de sinais vitais e priorização clínica imediata.',
      destaques: ['5 níveis de prioridade visual', 'Tempo-alvo de espera por cor', 'Histórico completo de sinais vitais']
    },
    {
      id: 'prontuario',
      categoria: 'clinico',
      icone: Stethoscope,
      cor: 'from-emerald-500 to-teal-500',
      tag: 'Consultório & PEP',
      titulo: 'Prontuário Eletrônico (SOAP)',
      descricao: 'Estrutura clínica padronizada (Subjetivo, Objetivo, Avaliação, Plano), catálogo CID-10 inteligente, prescrição de medicamentos e emissão de atestados.',
      destaques: ['Metodologia SOAP completa', 'Catálogo CID-10 integrado', 'Atestados e relatórios digitais']
    },
    {
      id: 'farmacia',
      categoria: 'farmacia',
      icone: Pill,
      cor: 'from-purple-500 to-indigo-500',
      tag: 'Suprimentos & Triagem',
      titulo: 'Farmácia Hospitalar (FEFO)',
      descricao: 'Validação técnica de prescrições, controle rigoroso por lote e validade (First Expire, First Out), bloqueio por saldo e importação de XML (NF-e).',
      destaques: ['Triagem técnica farmacêutica', 'Controle FEFO automatizado', 'Importação direta de NF-e']
    },
    {
      id: 'enfermagem',
      categoria: 'clinico',
      icone: HeartPulse,
      cor: 'from-rose-500 to-pink-500',
      tag: 'Assistência & Segurança',
      titulo: 'Enfermagem & Beira-Leito',
      descricao: 'Administração de medicamentos com dupla checagem dos 5 Certos (Paciente, Medicamento, Dose, Via, Horário), evoluções de turno e SAE.',
      destaques: ['Validação dos 5 Certos', 'Anotações de enfermagem', 'Balanço hídrico e cuidados']
    },
    {
      id: 'internamento',
      categoria: 'gestao',
      icone: BedDouble,
      cor: 'from-sky-500 to-blue-600',
      tag: 'Gestão de Leitos',
      titulo: 'Mapa de Leitos Visual',
      descricao: 'Visão gráfica da taxa de ocupação hospitalar por clínica e ala em tempo real. Controle de admissões, transferências e status de higienização.',
      destaques: ['Status em tempo real (Vago/Ocupado)', 'Controle de isolamento e UTI', 'Admissões e transferências ágeis']
    },
    {
      id: 'painel',
      categoria: 'gestao',
      icone: Monitor,
      cor: 'from-amber-600 to-red-600',
      tag: 'Comunicação',
      titulo: 'Painel de Chamadas Multimídia',
      descricao: 'Chamada de pacientes para TVs e monitores da recepção e consultórios com sintetização de voz, separação por setor e histórico recente.',
      destaques: ['Chamada sonora e visual', 'Setorização (Triagem/Consultório)', 'Design adaptado para Smart TVs']
    },
    {
      id: 'relatorios',
      categoria: 'gestao',
      icone: BarChart3,
      cor: 'from-teal-500 to-emerald-600',
      tag: 'Inteligência & BI',
      titulo: 'Relatórios & BI Hospitalar',
      descricao: 'Painéis consolidados com métricas de tempo de espera, taxa de ocupação, distribuição por gravidade Manchester e exportação instantânea em CSV/PDF.',
      destaques: ['Exportação em 1 clique', 'Métricas analíticas por período', 'Conformidade com padrões FHIR R4']
    }
  ];

  const modulosFiltrados = activeTab === 'todos' 
    ? modulos 
    : modulos.filter(m => m.categoria === activeTab);

  const rolesData = {
    MEDICO: {
      titulo: 'Visão do Médico / Corpo Clínico',
      descricao: 'Foco total no cuidado ao paciente: fila médica organizada por urgência clínica, prontuário estruturado SOAP, prescrição com busca inteligente e emissão de laudos.',
      recursos: [
        'Fila de atendimento priorizada pelo Protocolo Manchester',
        'Prontuário Eletrônico completo com CID-10',
        'Prescrição médica com modelos pré-configurados',
        'Emissão de atestados médicos e solicitação de internação',
        'Acesso rápido ao histórico de exames e atendimentos anteriores'
      ],
      badgeCor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    },
    ENFERMEIRO: {
      titulo: 'Visão do Enfermeiro & Equipe Assistencial',
      descricao: 'Classificação ágil de risco Manchester, aferição de sinais vitais, aplicação segura de medicamentos à beira-leito e anotações de enfermagem.',
      recursos: [
        'Triagem Manchester completa com escala de dor e discriminadores',
        'Checagem dos 5 Certos na administração de medicamentos',
        'Anotações de evolução de enfermagem e SAE',
        'Gestão de admissões e alocação de leitos hospitalares',
        'Acionamento do painel de chamada de pacientes'
      ],
      badgeCor: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    },
    FARMACEUTICO: {
      titulo: 'Visão do Farmacêutico Hospitalar',
      descricao: 'Controle rigoroso do ciclo de medicamentos: validação técnica de prescrições, controle de lote/validade FEFO, importação de NF-e e relatórios de consumo.',
      recursos: [
        'Triagem técnica e aprovação/rejeição de itens prescritos',
        'Controle FEFO (Primeiro a Vencer, Primeiro a Sair)',
        'Bloqueio automático por insuficiência de saldo em estoque',
        'Importação automatizada de XML de Notas Fiscais (NF-e)',
        'Catálogo unificado de medicamentos, materiais e sinônimos'
      ],
      badgeCor: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
    },
    RECEPCIONISTA: {
      titulo: 'Visão da Recepção & Atendimento ao Cliente',
      descricao: 'Acolhimento rápido, busca instantânea de pacientes por CPF, abertura de atendimentos por setor e impressão de fichas de encaminhamento.',
      recursos: [
        'Cadastro seguro com proteção e anonimização de dados sensíveis',
        'Preenchimento automático de endereço via CEP (ViaCEP)',
        'Abertura de atendimento e direcionamento para a fila de triagem',
        'Consulta de mapa de leitos para suporte a visitantes e internações',
        'Impressão de ficha cadastral e comprovante de atendimento'
      ],
      badgeCor: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    },
    ADMIN: {
      titulo: 'Visão do Administrador & Direção Hospitalar',
      descricao: 'Governança total: controle de usuários e permissões granulares (RBAC), logs imutáveis de auditoria, relatórios gerenciais e parametrização institucional.',
      recursos: [
        'Gestão completa de usuários, médicos (CRM) e enfermeiros (COREN)',
        'Logs de auditoria em tempo real para conformidade estrita com a LGPD',
        'Relatórios gerenciais consolidados de produção e ocupação',
        'Parametrização de clínicas, alas, leitos e prescrições padrão',
        'Configurações de segurança, sessões ativas e autenticação MFA/TOTP'
      ],
      badgeCor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
    }
  };

  const manchesterCores = [
    { cor: 'Vermelho', tempo: '0 min (Imediato)', prioridade: 'Emergência', bg: 'bg-red-600 text-white', desc: 'Risco iminente de morte. Atendimento e suporte avançado instantâneos.' },
    { cor: 'Laranja', tempo: '10 min', prioridade: 'Muito Urgente', bg: 'bg-orange-500 text-white', desc: 'Gravidade significativa. Alta prioridade com risco de deterioração clínica.' },
    { cor: 'Amarelo', tempo: '60 min', prioridade: 'Urgente', bg: 'bg-amber-400 text-slate-900', desc: 'Gravidade moderada. Necessita de investigação e alívio sintomático rápido.' },
    { cor: 'Verde', tempo: '120 min', prioridade: 'Pouco Urgente', bg: 'bg-emerald-500 text-white', desc: 'Condições de baixa complexidade ou queixas crônicas estáveis.' },
    { cor: 'Azul', tempo: '240 min', prioridade: 'Não Urgente', bg: 'bg-blue-500 text-white', desc: 'Casos não urgentes com encaminhamento ambulatorial ou orientações.' },
  ];

  const faqs = [
    {
      pergunta: 'O sistema atende aos requisitos de conformidade com a LGPD?',
      resposta: 'Sim! O SGH adota arquitetura de segurança Privacy by Design. CPFs, telefones e nomes são criptografados com o algoritmo AES-256-GCM. Todas as consultas e alterações registram logs de auditoria imutáveis com IP, usuário e timestamp.'
    },
    {
      pergunta: 'Como funciona a triagem pelo Protocolo de Manchester no SGH?',
      resposta: 'O módulo de triagem é 100% aderente ao fluxo do Manchester Triage System. O enfermeiro seleciona fluxogramas e discriminadores, insere os sinais vitais e a escala de dor, e o sistema classifica automaticamente o nível de prioridade (Vermelho a Azul) com controle do tempo-alvo de atendimento.'
    },
    {
      pergunta: 'O SGH funciona em tablets e dispositivos móveis?',
      resposta: 'Sim. O SGH é uma Progressive Web App (PWA) totalmente responsiva, otimizada para computadores de mesa, notebooks médicos, tablets de beira-leito e smartphones de equipes volantes.'
    },
    {
      pergunta: 'A farmácia hospitalar possui integração com a prescrição médica?',
      resposta: 'Sim. Ao emitir uma prescrição no consultório ou enfermaria, os itens são imediatamente direcionados à triagem da farmácia, onde o farmacêutico valida a dosagem, verifica o saldo em estoque e dispensa os lotes mais próximos do vencimento (regra FEFO).'
    },
    {
      pergunta: 'Como é feita a gestão e controle de leitos?',
      resposta: 'O módulo Mapa de Leitos exibe visualmente a planta do hospital dividida por Clínicas e Alas. Cada leito sinaliza se está Livre, Ocupado, em Higienização ou Interditado, permitindo internações e transferências em apenas 2 cliques.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* NAVBAR SUPERIOR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">SGH</span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">v2.5 Enterprise</span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Sistema de Gestão Hospitalar & Clínica</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#modulos" className="hover:text-blue-400 transition-colors">Módulos</a>
            <a href="#manchester" className="hover:text-blue-400 transition-colors">Triagem Manchester</a>
            <a href="#perfis" className="hover:text-blue-400 transition-colors">Perfis & RBAC</a>
            <a href="#jornada" className="hover:text-blue-400 transition-colors">Fluxo Hospitalar</a>
            <a href="#seguranca" className="hover:text-blue-400 transition-colors">Segurança & LGPD</a>
            <a href="#faq" className="hover:text-blue-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <span>Acessar Sistema</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-28 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-blue-400 mb-8 shadow-inner">
            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span>Ecossistema Hospitalar de Alta Performance & Segurança Clínica</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.15]">
            A Nova Geração da Gestão Hospitalar <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300">Integrada e Segura</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Recepção, Triagem Manchester oficial, Prontuário Eletrônico SOAP, Farmácia FEFO com controle de lote, checagem beira-leito dos 5 Certos e Mapa de Leitos em tempo real — tudo com conformidade estrita com a LGPD.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-xl shadow-blue-600/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>Entrar na Plataforma</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#modulos"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-base transition-all flex items-center justify-center gap-2"
            >
              <Layers className="h-5 w-5 text-blue-400" />
              <span>Explorar Módulos</span>
            </a>
          </div>

          {/* Badges de Destaque */}
          <div className="mt-16 pt-12 border-t border-slate-800/60 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3 text-blue-400 mb-2">
                <Shield className="h-5 w-5" />
                <span className="font-bold text-sm text-slate-200">LGPD & Criptografia</span>
              </div>
              <p className="text-xs text-slate-400">Dados sensíveis criptografados em AES-256-GCM com logs de auditoria imutáveis.</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3 text-amber-400 mb-2">
                <Award className="h-5 w-5" />
                <span className="font-bold text-sm text-slate-200">Protocolo Manchester</span>
              </div>
              <p className="text-xs text-slate-400">Classificação de risco com 5 níveis de gravidade e cálculo automatizado de IMC.</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3 text-emerald-400 mb-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-bold text-sm text-slate-200">5 Certos de Enfermagem</span>
              </div>
              <p className="text-xs text-slate-400">Dupla checagem obrigatória à beira-leito para prevenir erros de medicação.</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3 text-purple-400 mb-2">
                <Laptop className="h-5 w-5" />
                <span className="font-bold text-sm text-slate-200">PWA & Multiplataforma</span>
              </div>
              <p className="text-xs text-slate-400">Acesse via navegadores, tablets médicos ou instale diretamente como aplicativo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MÉTRICAS DE IMPACTO HOSPITALAR */}
      <section className="py-16 bg-slate-900/60 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl sm:text-5xl font-extrabold text-blue-400 mb-2">-45%</div>
              <p className="text-sm font-semibold text-slate-200">Tempo de Espera no PS</p>
              <p className="text-xs text-slate-400 mt-1">Otimização através de filas inteligentes e painéis em tempo real</p>
            </div>

            <div className="p-6">
              <div className="text-4xl sm:text-5xl font-extrabold text-emerald-400 mb-2">100%</div>
              <p className="text-sm font-semibold text-slate-200">Rastreabilidade LGPD</p>
              <p className="text-xs text-slate-400 mt-1">Logs de auditoria em cada visualização ou alteração de prontuário</p>
            </div>

            <div className="p-6">
              <div className="text-4xl sm:text-5xl font-extrabold text-purple-400 mb-2">0 Falhas</div>
              <p className="text-sm font-semibold text-slate-200">Dispensação de Lotes</p>
              <p className="text-xs text-slate-400 mt-1">Regra estrita FEFO impedindo a saída de medicamentos vencidos</p>
            </div>

            <div className="p-6">
              <div className="text-4xl sm:text-5xl font-extrabold text-cyan-400 mb-2">99.9%</div>
              <p className="text-sm font-semibold text-slate-200">Disponibilidade Operacional</p>
              <p className="text-xs text-slate-400 mt-1">Arquitetura moderna com banco de dados de alta integridade</p>
            </div>
          </div>
        </div>
      </section>

      {/* MÓDULOS E RECURSOS DO SISTEMA */}
      <section id="modulos" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Módulos & Funcionalidades</h2>
          <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Tudo o que seu hospital precisa em uma única plataforma
          </p>
          <p className="mt-4 text-base text-slate-400">
            Módulos integrados concebidos para eliminar retrabalho, diminuir filas e garantir a segurança do paciente em cada etapa assistencial.
          </p>

          {/* Categorias / Tabs */}
          <div className="mt-8 flex flex-wrap justify-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 w-fit mx-auto">
            {[
              { id: 'todos', label: 'Todos os Módulos' },
              { id: 'clinico', label: 'Assistencial & Clínico' },
              { id: 'farmacia', label: 'Farmácia & Estoque' },
              { id: 'gestao', label: 'Gestão & Recepção' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grade de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modulosFiltrados.map((modulo) => {
            const Icon = modulo.icone;
            return (
              <div
                key={modulo.id}
                className="group relative bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-tr ${modulo.cor} flex items-center justify-center text-white shadow-lg shadow-blue-500/10`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700/60">
                      {modulo.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {modulo.titulo}
                  </h3>

                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    {modulo.descricao}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-800/60">
                  {modulo.destaques.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PROTOCOLO MANCHESTER EM DESTAQUE */}
      <section id="manchester" className="py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Módulo de Urgência</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2 mb-4">
                Protocolo de Manchester Totalmente Integrado
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                Garanta o atendimento prioritário aos pacientes mais graves com precisão clínica inquestionável. O algoritmo orienta a equipe de enfermagem passo a passo através de fluxogramas e discriminadores oficiais.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Cálculo de IMC Automático</h4>
                    <p className="text-xs text-slate-400">Informando peso e altura, o sistema calcula o IMC e categoriza o estado nutricional.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Sinais Vitais e Escala de Dor</h4>
                    <p className="text-xs text-slate-400">Registro de PA, FC, FR, SpO2, Temperatura, Glicemia capilar e Escala Visual Analógica (EVA).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Integração Instantânea com Painel</h4>
                    <p className="text-xs text-slate-400">Ao classificar, o paciente entra imediatamente na fila do médico com ordenação por gravidade.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              {manchesterCores.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <span className={`px-3 py-1.5 rounded-xl font-extrabold text-xs shadow-md ${item.bg}`}>
                      {item.cor}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-white">{item.prioridade}</div>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 sm:text-right shrink-0 bg-slate-800/80 px-3 py-1.5 rounded-xl">
                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                    <span>Tempo: {item.tempo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEGMENTAÇÃO POR PERFIS / RBAC */}
      <section id="perfis" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">Segmentação por Níveis de Acesso</h2>
          <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Interface personalizada para cada profissional de saúde
          </p>
          <p className="mt-4 text-base text-slate-400">
            Cada membro da equipe hospitalar visualiza exatamente o que precisa para desempenhar suas atribuições com foco, segurança e privacidade.
          </p>

          {/* Seletores de Perfil */}
          <div className="mt-8 flex flex-wrap justify-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 w-fit mx-auto">
            {[
              { id: 'MEDICO', label: '👨‍⚕️ Médico' },
              { id: 'ENFERMEIRO', label: '🩺 Enfermeiro' },
              { id: 'FARMACEUTICO', label: '💊 Farmacêutico' },
              { id: 'RECEPCIONISTA', label: '🗂️ Recepção' },
              { id: 'ADMIN', label: '🛡️ Administrador' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveRole(p.id as any)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeRole === p.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card do Perfil Selecionado */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${rolesData[activeRole].badgeCor}`}>
                  Perfil Autorizado
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                  {rolesData[activeRole].titulo}
                </h3>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold text-xs border border-slate-700 transition-colors w-fit"
              >
                <span>Testar Acesso com este Perfil</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              {rolesData[activeRole].descricao}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rolesData[activeRole].recursos.map((recurso, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
                  <div className="h-5 w-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs shrink-0 font-bold">✓</div>
                  <span className="text-xs sm:text-sm text-slate-200 font-medium">{recurso}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* JORNADA DO PACIENTE (TIMELINE INTERATIVA) */}
      <section id="jornada" className="py-20 bg-slate-900/60 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Ciclo de Vida do Atendimento</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-2">
              Jornada Hospitalar de Ponta a Ponta
            </h2>
            <p className="mt-4 text-base text-slate-400">
              Acompanhe a trajetória completa de cada paciente com sincronização em tempo real entre todos os setores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { passo: '1', titulo: 'Recepção', status: 'AGUARDANDO_TRIAGEM', desc: 'Identificação segura e abertura do atendimento.', icone: Users },
              { passo: '2', titulo: 'Triagem', status: 'EM_TRIAGEM', desc: 'Classificação Manchester e sinais vitais.', icone: ClipboardList },
              { passo: '3', titulo: 'Consultório', status: 'EM_ATENDIMENTO', desc: 'Prontuário SOAP, CID-10 e prescrição.', icone: Stethoscope },
              { passo: '4', titulo: 'Farmácia', status: 'APROVADO', desc: 'Triagem farmacêutica e dispensação FEFO.', icone: Pill },
              { passo: '5', titulo: 'Enfermagem', status: 'APLICADO', desc: 'Administração com checagem dos 5 Certos.', icone: HeartPulse },
              { passo: '6', titulo: 'Internação/Alta', status: 'ALTA / INTERNADO', desc: 'Alocação de leito ou desfecho clínico.', icone: BedDouble },
            ].map((etapa, idx) => {
              const Icon = etapa.icone;
              return (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-8 w-8 rounded-xl bg-blue-600/20 text-blue-400 font-extrabold text-sm flex items-center justify-center border border-blue-500/30">
                        {etapa.passo}
                      </div>
                      <Icon className="h-5 w-5 text-slate-400" />
                    </div>
                    <h3 className="font-bold text-base text-white mb-1">{etapa.titulo}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{etapa.desc}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-1 bg-slate-950 text-slate-400 rounded-lg border border-slate-800 block text-center truncate">
                    {etapa.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEGURANÇA, PRIVACIDADE & LGPD */}
      <section id="seguranca" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Segurança de Nível Hospitalar</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Proteção de Dados Sensíveis e Conformidade Total com a LGPD
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              O SGH foi construído com os mais elevados padrões de segurança cibernética e privacidade da informação em saúde. Seus pacientes e sua instituição estão permanentemente resguardados.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <Lock className="h-6 w-6 text-blue-400 shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold text-white">Criptografia AES-256-GCM</h4>
                  <p className="text-xs text-slate-400">Nomes, CPFs, RGs e contatos são criptografados antes do armazenamento no banco de dados.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <Shield className="h-6 w-6 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold text-white">Logs Imutáveis de Auditoria</h4>
                  <p className="text-xs text-slate-400">Cada leitura, edição ou acesso a prontuários gera registro imutável com usuário, IP e timestamp.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <Zap className="h-6 w-6 text-purple-400 shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold text-white">Autenticação MFA / TOTP</h4>
                  <p className="text-xs text-slate-400">Suporte a segundo fator de autenticação para proteção de contas médicas e administrativas.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-400" />
                <span>Padrões e Conformidades Técnicas</span>
              </h3>

              <div className="space-y-4">
                {[
                  { padrao: 'LGPD (Lei 13.709/2018)', status: '100% Conforme', desc: 'Tratamento rigoroso de dados sensíveis de saúde.' },
                  { padrao: 'CFM / SBIS (Nível 2)', status: 'Aderente', desc: 'Prontuário eletrônico com trilha completa de auditoria.' },
                  { padrao: 'Manchester Triage Group', status: 'Oficial', desc: 'Algoritmo validado para classificação de risco clínico.' },
                  { padrao: 'HL7 / FHIR R4', status: 'Interoperável', desc: 'Pronto para exportações e integrações de prontuário.' },
                  { padrao: 'PWA Web App', status: 'Offline-Ready', desc: 'Instalável em desktops, tablets e smartphones.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-slate-200">{item.padrao}</span>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full shrink-0">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Dúvidas Frequentes</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
              Perguntas & Respostas sobre o SGH
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-bold text-sm sm:text-base text-slate-200 flex items-center justify-between gap-4 hover:text-blue-400 transition-colors"
                  >
                    <span>{faq.pergunta}</span>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-4">
                      {faq.resposta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-slate-950 to-blue-950/40 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-blue-500/20">
            <Activity className="h-8 w-8" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Pronto para transformar a gestão do seu hospital?
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Acesse agora mesmo o sistema com os perfis de demonstração e explore todas as funcionalidades em tempo real.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-10 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-xl shadow-blue-600/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>Acessar o SGH Agora</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-slate-200">SGH</span> — Sistema de Gestão Hospitalar
              <p className="text-[11px] text-slate-500">Versão 2.5.1 Enterprise • Arquitetura Segura & Modular</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <a href="#modulos" className="hover:text-slate-200 transition-colors">Módulos</a>
            <a href="#seguranca" className="hover:text-slate-200 transition-colors">Segurança LGPD</a>
            <a href="#faq" className="hover:text-slate-200 transition-colors">FAQ</a>
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">Entrar no Sistema</Link>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-500">
            © {new Date().getFullYear()} SGH. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
