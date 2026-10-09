# 🏥 MANUAL OFICIAL DO SISTEMA DE GESTÃO HOSPITALAR (SGH)

> **Versão do Sistema:** v2.7.14  
> **Classificação:** Manual de Operação, Funcionalidades, Regras de Negócio e Telas  
> **Público-Alvo:** Médicos, Enfermeiros, Técnicos de Enfermagem, Farmacêuticos, Recepcionistas, Diretores Clínicos e Administradores.

---

## 📑 ÍNDICE GERAL

1. [Visão Geral e Arquitetura do Sistema](#1-visão-geral-e-arquitetura-do-sistema)
2. [Módulo 1: Recepção & Admissão de Pacientes](#2-módulo-1-recepção--admissão-de-pacientes)
3. [Módulo 2: Triagem & Protocolo de Manchester](#3-módulo-2-triagem--protocolo-de-manchester)
4. [Módulo 3: Consultório Médico & Pronto-Socorro (PS)](#4-módulo-3-consultório-médico--pronto-socorro-ps)
   - 4.1. [Anamnese e Exame Físico](#41-anamnese-e-exame-físico)
   - 4.2. [Diagnósticos (CID-10)](#42-diagnósticos-cid-10)
   - 4.3. [Prescrição de Medicamentos vs Procedimentos e Cuidados](#43-prescrição-de-medicamentos-vs-procedimentos-e-cuidados)
   - 4.4. [Kits de Insumos & Materiais da Farmácia](#44-kits-de-insumos--materiais-da-farmácia)
   - 4.5. [Histórico Longitudinal do Paciente (PEP)](#45-histórico-longitudinal-do-paciente-pep)
   - 4.6. [Ficha Obstétrica & Acompanhamento da Gestante](#46-ficha-obstétrica--acompanhamento-da-gestante)
   - 4.7. [Exames, Receita de Alta e Encaminhamentos](#47-exames-receita-de-alta-e-encaminhamentos)
5. [Módulo 4: Farmácia & Almoxarifado](#5-módulo-4-farmácia--almoxarifado)
   - 5.1. [Estoque, Entradas NFe (XML) e Lotes](#51-estoque-entradas-nfe-xml-e-lotes)
   - 5.2. [Dispensação de Medicamentos, Procedimentos e Kits](#52-dispensação-de-medicamentos-procedimentos-e-kits)
   - 5.3. [Saídas Manuais, Sinônimos e Fornecedores](#53-saídas-manuais-sinônimos-e-fornecedores)
6. [Módulo 5: Internamento & Gestão de Leitos](#6-módulo-5-internamento--gestão-de-leitos)
   - 5.1. [Mapa de Leitos e Painel de Admissões](#61-mapa-de-leitos-e-painel-de-admissões)
   - 5.2. [Prontuário Médico de Internação](#62-prontuário-médico-de-internação)
   - 5.3. [Prontuário de Enfermagem (Evoluções Diurna/Noturna, Sinais Vitais, SAE)](#63-prontuário-de-enfermagem)
   - 5.4. [Medicação Berçário Neonatal](#64-medicação-berçário-neonatal)
   - 5.5. [Condições de Alta & Encerramento Hospitalar (Exclusivo Médico)](#65-condições-de-alta--encerramento-hospitalar)
7. [Módulo 6: Painel TV & Chamador com Voz Sintetizada](#7-módulo-6-painel-tv--chamador-com-voz-sintetizada)
8. [Módulo 7: Relatórios Gerenciais & Indicadores SUS](#8-módulo-7-relatórios-gerenciais--indicadores-sus)
9. [Módulo 8: Segurança, Auditoria e Controle de Acesso (RBAC)](#9-módulo-8-segurança-auditoria-e-controle-de-acesso-rbac)

---

## 1. VISÃO GERAL E ARQUITETURA DO SISTEMA

O **SGH (Sistema de Gestão Hospitalar)** é uma plataforma integrada de prontuário eletrônico do paciente (PEP), triagem com classificação de risco Manchester, farmácia com rastreabilidade de lotes, internação com mapa dinâmico de leitos e faturamento SUS.

- **Frontend & Backend:** Next.js (App Router), React, TypeScript e Tailwind CSS.
- **Banco de Dados:** PostgreSQL com Prisma ORM.
- **Comunicação em Tempo Real:** WebSockets (Pusher) para chamadas de pacientes na TV e sincronização de filas.
- **Segurança:** NextAuth.js com RBAC (Role-Based Access Control) e auditoria imutável via `LogAuditoria`.

---

## 2. MÓDULO 1: RECEPÇÃO & ADMISSÃO DE PACIENTES

### Rotas: `/recepcao`, `/recepcao/novo` e `/recepcao/imprimir/[numeroAtendimento]`

### Finalidade:
Identificar o cidadão, validar documentos oficiais (CPF e Cartão SUS), verificar atendimentos anteriores e abrir o episódio de atendimento na fila de triagem.

### Campos da Tela:
| Campo | Tipo | Obrigatoriedade | Regra de Negócio / Particularidade |
|---|---|---|---|
| **CPF** | Numérico mascarado | Obrigatório | Validação algorítmica dos dígitos verificadores (impede CPFs inválidos). |
| **Cartão SUS (CNS)** | 15 dígitos | Obrigatório | Identificador nacional do SUS para BPA/AIH. |
| **Nome Completo** | Texto | Obrigatório | Nome civil registrado no documento oficial. |
| **Nome Social** | Texto | Opcional | Exibido com prioridade na TV e pulseiras em respeito à identidade de gênero. |
| **Data de Nascimento** | Data | Obrigatório | Calcula a idade exata e sinaliza pacientes idosos (≥60 anos) ou pediátricos. |
| **Sexo Biológico** | Seleção | Obrigatório | `MASCULINO` / `FEMININO` — define regras obstétricas e exames específicos. |
| **Nome da Mãe** | Texto | Obrigatório | Desambiguação de homônimos no CadSUS. |
| **Endereço / CEP** | Numérico | Opcional | Preenchimento automático de logradouro, bairro, cidade e UF via ViaCEP. |
| **Procedência** | Seleção | Obrigatório | Residência, Via Pública, Trabalho, Transferência inter-hospitalar. |
| **Tipo de Atendimento** | Seleção | Obrigatório | `ELETIVO`, `URGENCIA` ou `EMERGENCIA`. |

### Botões e Ações:
- **Salvar e Enviar para Triagem:** Cria o atendimento com status `AGUARDANDO_TRIAGEM` e notifica o posto de enfermagem.
- **Imprimir Ficha de Admissão:** Gera a folha de rosto física para a pasta do prontuário.
- **Buscar por CPF / SUS:** Preenche automaticamente o formulário com o cadastro já existente no hospital.

---

## 3. MÓDULO 2: TRIAGEM & PROTOCOLO DE MANCHESTER

### Rotas: `/triagem` e `/triagem/[atendimentoId]`

### Finalidade:
Classificação de risco clínico e estratificação de prioridade de acordo com o Protocolo de Manchester por enfermeiros habilitados.

### Escalas e Cores de Prioridade:
- 🔴 **Vermelho (Emergência):** Tempo máximo de espera: **0 minutos** (encaminhamento imediato à Sala Vermelha).
- 🟠 **Laranja (Muito Urgente):** Tempo máximo de espera: **10 minutos**.
- 🟡 **Amarelo (Urgente):** Tempo máximo de espera: **60 minutos**.
- 🟢 **Verde (Pouco Urgente):** Tempo máximo de espera: **120 minutos**.
- 🔵 **Azul (Não Urgente):** Tempo máximo de espera: **240 minutos**.

### Parâmetros e Sinais Vitais:
- **PA (Pressão Arterial):** Sistólica e Diastólica em mmHg (destaca alerta se PA ≥ 180/110 ou ≤ 90/60).
- **FC (Frequência Cardíaca):** Batimentos por minuto (avisa taquicardia > 100 ou bradicardia < 60).
- **FR (Frequência Respiratória):** Incursões por minuto (avisa taquipneia em desconforto respiratório).
- **SpO₂ (Saturação de Oxigênio):** Porcentagem de O₂ (alerta crítico se < 92%).
- **Temperatura Corporal:** Graus Celsius (alerta febre se ≥ 37.8°C).
- **Glicemia Capilar:** mg/dL (para diabéticos, idosos ou alteração de consciência).
- **Escala Visual Analógica de Dor (EVA):** 0 a 10 (dores ≥ 8 aumentam a gravidade da cor).
- **Alerta Obstétrico:** Sinalização visual com orientações quando a paciente for identificada como gestante/puérpera.

---

## 4. MÓDULO 3: CONSULTÓRIO MÉDICO & PRONTO-SOCORRO (PS)

### Rotas: `/atendimento` e `/atendimento/[atendimentoId]`

### 4.1. Anamnese e Exame Físico
- Registro estruturado da Queixa Principal, História da Doença Atual (HDA), Antecedentes Pessoais/Familiares e Hábitos de Vida.
- Proteção contra perda: Auto-save periódico em background.
- Contexto obstétrico inteligente orientando o acesso à Ficha Obstétrica.

### 4.2. Diagnósticos (CID-10)
- Busca dinâmica inteligente por código ou descrição da doença.
- Suporte a múltiplos CIDs com definição de diagnóstico principal e hipóteses diagnósticas.

### 4.3. Prescrição de Medicamentos vs Procedimentos e Cuidados
- **Medicamentos PS:** Medicamentos para aplicação imediata (injetáveis, inalações, orais). Bloqueia a finalização da consulta até a confirmação de aplicação pela enfermagem e registro da evolução pós-uso.
- **Procedimentos & Cuidados de Enfermagem:** O médico pode prescrever procedimentos específicos como:
  - Curativos simples ou especiais;
  - Sondagem vesical de alívio ou demora;
  - Sondagem nasogástrica / nasoenteral;
  - Punção venosa periférica / acesso venoso;
  - Oxigenioterapia / Nebulização;
  - Retirada de pontos e imobilizações.

### 4.4. Kits de Insumos & Materiais da Farmácia
- Cada procedimento prescrito pode conter uma descrição detalhada de execução e um **Kit de Insumos/Materiais** vinculado.
- Ao salvar a prescrição, a **Farmácia** recebe a solicitação na tela de Dispensação com a listagem completa dos materiais que compõem o kit para separação e baixa.

### 4.5. Histórico Longitudinal do Paciente (PEP)
- Visualização completa da linha do tempo do paciente em página isolada e focada, sem barras de menu redundantes.
- Consolidação cronológica de todas as consultas, internações, exames, diagnósticos e medicamentos anteriores.

### 4.6. Ficha Obstétrica & Acompanhamento da Gestante
- Ativada pelo botão **Atendimento Obstétrico** no cabeçalho do paciente (restrito a sexo biológico feminino).
- Dados integrados em todas as fases:
  - **Atenção Médica:** DUM, DPP, Idade Gestacional, Gesta/Para/Abortos.
  - **Trabalho de Parto:** Dilatação cervical (cm), contrações por minuto, BCF (batimentos cardiofetais).
  - **Puerpério e RN:** Apgar, peso de nascimento, sexo e cuidados neonatais.

### 4.7. Exames, Receita de Alta e Encaminhamentos
- Emissão de requisições laboratoriais e de imagem.
- Emissão de receita domiciliar com assinatura e CRM.
- Encaminhamentos para especialidades ou solicitação de internação hospitalar (AIH).

---

## 5. MÓDULO 4: FARMÁCIA & ALMOXARIFADO

### Rotas: `/farmacia`, `/farmacia/dispensacao`, `/farmacia/entradas`, `/farmacia/medicamentos`, `/farmacia/saidas`

### 5.1. Estoque, Entradas NFe (XML) e Lotes
- **Importação de NFe (XML):** Leitura automática de medicamentos, quantidades, lotes, validades e valores unitários.
- **Rastreabilidade de Lotes:** Controle por data de validade com alerta amarelo (90 dias) e bloqueio automático de itens vencidos.
- **Critério PEPS/FEFO:** O lote mais próximo de vencer é sugerido primeiro na dispensação.

### 5.2. Dispensação de Medicamentos, Procedimentos e Kits
- Central de atendimento para prescrições de PS e Enfermaria.
- **Visão Unificada de Materiais:** Exibe tanto os fármacos prescritos quanto os **materiais e kits de procedimentos** solicitados pelo médico para a enfermagem.
- Baixa individual ou em lote com registro de rastreabilidade.

### 5.3. Saídas Manuais, Sinônimos e Fornecedores
- **Saídas Manuais:** Baixas por avaria, vencimento, empréstimo, descarte ou transferência com justificativa.
- **Sinônimos Comerciais:** Associação de múltiplos nomes comerciais ao mesmo princípio ativo.
- **Fornecedores:** Gestão de distribuidores com CNPJ e histórico de compras.

---

## 6. MÓDULO 5: INTERNAMENTO & GESTÃO DE LEITOS

### Rotas: `/internamento/admissoes`, `/internamento/admitir`, `/prontuario/[id]` e `/evolucoes/[id]`

### 6.1. Mapa de Leitos e Painel de Admissões
- Visualização gráfica de alas, quartos e leitos:
  - 🟢 **Verde:** Leito Livre;
  - 🔴 **Vermelho:** Leito Ocupado;
  - 🟡 **Amarelo:** Leito em Higienização;
  - ⚫ **Cinza:** Leito Interditado.
- Admissão rápida de pacientes encaminhados pelo PS ou recepção.

### 6.2. Prontuário Médico de Internação (`/prontuario/[id]`)
- **Evolução Médica Diária (`FICHA_EVOLUCAO`):** Registro de conduta médica diária com histórico cronológico.
- **Prescrições da Enfermaria (`PRESCRICAO_ENFERMARIA`):** Prescrição diária hospitalar com aprazamento.
- **Exames (`EXAMES`):** Solicitação e visualização de resultados de exames.
- **Condições de Alta (`CONDICOES_ALTA`):** Aba exclusiva para avaliação e concessão de alta hospitalar.
- **Laudo de Solicitação (`LAUDO_MEDICO`):** Justificativa clínica e laudo para emissão de AIH (SUS).
- **Ficha Obstétrica (`INTERNACAO_OBSTETRICA`):** Acompanhamento de parto e puerpério.

### 6.3. Prontuário de Enfermagem (`/evolucoes/[id]`)
- **Internação (`INTERNACAO_ALTA`):** Dados de admissão e identificação do internamento.
- **Medicamentos (`INSTRUCOES_ENFERMAGEM`):** Checagem e aprazamento de doses aplicadas.
- **CCIH (`CCIH`):** Controle de dispositivos invasivos e infecção hospitalar.
- **Ficha Sinais Vitais (`SINAIS_VITAIS`):** Monitoramento de sinais e balanço hídrico diário.
- **Evolução Noite/Dia (`EVOLUCAO_DIURNA_NOTURNA`):** Registro de plantão diurno e noturno.
- **SAE (`SAE`):** Sistematização da Assistência de Enfermagem.
- **Multidisciplinar (`MULTIDISCIPLINAR`):** Registros de Fisioterapia, Nutrição, Psicologia e Serviço Social.
- **Medicação Berçário (`MEDICACAO_BERCARIO`):** Aprazamento de cuidados com recém-nascidos.

### 6.4. Medicação Berçário Neonatal
- Gerenciamento de prescrições e cuidados voltados exclusivamente aos recém-nascidos de mães internadas na maternidade.

### 6.5. Condições de Alta & Encerramento Hospitalar
- **Exclusividade Médica (RBAC):** Somente usuários com perfil `MEDICO`, `DIRETOR_CLINICO` ou `ADMIN` têm permissão para registrar e concluir a alta.
- **Campos de Saída:** Condições (Curado, Melhorado, Internado, Piorado), Motivo da Alta (Decisão Médica, Alta Pedida, Transferência, Indisciplina), Diagnóstico Definitivo (CID-10), Registro de Óbito (+/- 48h) e CRM do médico responsável.
- **Desfecho:** Ao concluir a alta, o leito é liberado automaticamente para status de higienização.

---

## 7. MÓDULO 6: PAINEL TV & CHAMADOR COM VOZ SINTETIZADA

### Rotas: `/painel` e `/medicacao`

### Funcionalidades:
- Painel em tela cheia para TVs na sala de espera.
- Chamada audiovisual em tempo real via WebSockets (Pusher).
- Sintetizador de voz em português (Web Speech API / TTS): anuncia o nome do paciente e a sala/consultório de destino.
- Destaque piscante para casos de emergência (Vermelho/Laranja).

---

## 8. MÓDULO 7: RELATÓRIOS GERENCIAIS & INDICADORES SUS

### Rotas: `/relatorios` e `/farmacia/relatorios`

### Relatórios Disponíveis:
- **Atendimentos por Período e Profissional:** Estatísticas de produtividade médica e de enfermagem.
- **Classificação de Risco (Manchester):** Quantitativo de pacientes por cor de gravidade e tempo médio de espera.
- **Ocupação Hospitalar:** Taxa de ocupação de leitos, tempo médio de permanência e giro de leitos.
- **Estoque Mínimo e Faltantes:** Relação de medicamentos e insumos com saldo crítico.
- **Exportação:** Geração de relatórios em PDF formatado para impressão e arquivos Excel (XLSX/CSV) para auditoria.

---

## 9. MÓDULO 8: SEGURANÇA, AUDITORIA E CONTROLE DE ACESSO (RBAC)

### Rotas: `/admin`, `/configuracoes` e `/auditoria`

### Matriz de Perfis (Roles) e Permissões:
| Papel (Role) | Recepção | Triagem | Consultório Médico | Enfermagem | Farmácia | Conceder Alta | Admin & Config |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **DIRETOR_CLINICO** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **MEDICO** | 👁️ (Leitura) | 👁️ (Leitura) | ✅ | 👁️ (Leitura) | 👁️ (Consulta) | ✅ | ❌ |
| **ENFERMEIRO** | 👁️ (Leitura) | ✅ | ❌ | ✅ | 👁️ (Consulta) | ❌ | ❌ |
| **TECNICO_ENFERMAGEM**| 👁️ (Leitura) | ❌ | ❌ | ✅ (Checagem) | ❌ | ❌ | ❌ |
| **FARMACEUTICO** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **RECEPCIONISTA** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Auditoria Imutável:
- Toda operação de criação, edição ou exclusão gera um registro automático na tabela `LogAuditoria` contendo:
  `usuarioId`, `acao` (`CRIACAO`, `ATUALIZACAO`, `EXCLUSAO`, `ACESSO`), `entidade`, `entidadeId`, `ipOrigem` e `createdAt`.
- Registros de auditoria são imutáveis e protegidos contra edição.

---
*Manual atualizado em conformidade com as diretrizes hospitalares do SGH v2.7.14.*
