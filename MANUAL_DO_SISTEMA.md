# 🏥 MANUAL OFICIAL DO SISTEMA DE GESTÃO HOSPITALAR (SGH)

> **Versão do Sistema:** v2.7.24  
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

### 5.4. Ajuste Dinâmico de Estoque & Inventário em Lote (`/farmacia/ajuste-estoque`)
- **Inventário em Lote:** Permite listar todo o catálogo de medicamentos, materiais e insumos com base em filtros avançados (Busca rápida, Tipo de Item, Situação de Saldo, Localização/Prateleira).
- **Lançamento Ágil de Contagem Física:** Permite lançar novos saldos físicos item a item ou gerenciar lotes e validades individualmente.
- **Cálculo Automático de Divergências:** Exibe em tempo real o diferencial (+ entradas / - baixas) e destaca os itens modificados.
- **Gravação Atômica em Massa:** O farmacêutico seleciona o motivo do ajuste (Inventário, Avaria, Vencimento, Transferência, etc.), informa a justificativa e salva todas as alterações de uma única vez em transação segura no banco de dados com registro no livro-razão (`TbFarmaciaMovimentacao`) e trilha de auditoria LGPD.

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

## 10. CONDIÇÕES E CRITÉRIOS DE ACESSO POR PERFIL DE USUÁRIO (RBAC)

O SGH implementa uma rigorosa política de **Controle de Acesso Baseado em Funções (RBAC)**, com separação explícita de responsabilidades médicas, assistenciais e administrativas:

### 10.1. Critérios de Acesso por Módulo e Função:
1. **Administrador (`ADMIN`):**
   - Acesso irrestrito a todos os módulos, cadastros, configurações do hospital (CNES/IBGE), logs de auditoria, permissões de usuários e relatórios financeiros/gerenciais.
2. **Diretor Clínico (`DIRETOR_CLINICO`):**
   - Autoridade médica máxima. Pode prescrever, evoluir, conceder alta, transferir/interditar leitos, assinar laudos AIH, aprovar protocolos clínicos e auditar registros de qualquer médico ou setor.
3. **Médico Assistente (`MEDICO`):**
   - Acesso completo ao Consultório (PS/Ambulatório), Prontuário Médico de Internação (`/prontuario/[id]`), Prescrição de Medicamentos e Procedimentos, Diagnósticos CID-10, Pedidos de Exames, Laudos de Solicitação AIH e **concessão exclusiva de Alta Hospitalar**.
   - Restrição: Não edita configurações globais nem acessa dispensação física da farmácia.
4. **Enfermeiro (`ENFERMEIRO`):**
   - Acesso total à Triagem Manchester, Prontuário de Enfermagem (`/evolucoes/[id]`), Checagem e Aprazamento de Medicamentos, Balanço Hídrico, SAE, CCIH, Sinais Vitais e Admissão de Leitos.
   - Restrição: Leitura de prescrições médicas; **estritamente bloqueado para prescrever medicamentos/procedimentos médicos ou conceder alta hospitalar**.
5. **Técnico de Enfermagem (`TECNICO_ENFERMAGEM`):**
   - Acesso à checagem de administração de medicamentos aplicados e registro de sinais vitais.
   - Restrição: Bloqueado para triagem de risco Manchester, SAE e prescrição.
6. **Farmacêutico / Almoxarife (`FARMACEUTICO`):**
   - Acesso completo à gestão de estoque, importação de NFe (XML), controle de lotes/validades, **dispensação de medicamentos, procedimentos e kits de insumos**.
   - Restrição: Sem acesso a edição de prontuários clínicos.
7. **Recepcionista (`RECEPCIONISTA`):**
   - Acesso ao cadastro de pacientes, validação de CPF/SUS, abertura de atendimentos e emissão de fichas de admissão física.
   - Restrição: Sem acesso a dados clínicos confidenciais (prontuário, prescrições, evoluções).

---

## 11. RELACIONAMENTOS DE DADOS E FLUXO INTERMODULAR

O SGH trabalha em uma malha de dados relacional altamente integrada. Abaixo está o mapeamento de como as entidades se relacionam:

```
[Paciente] 
   └── 1:N [Atendimento]
             ├── 1:1 [Triagem] (Sinais Vitais, Cor Manchester, Alerta Obstétrico)
             ├── 1:1 [Prontuario]
             │         ├── 1:N [Prescricao]
             │         │         ├── Itens Medicamentos ──> Estoque Farmácia (Lotes/PEPS)
             │         │         └── Itens Procedimentos ──> Vinculação com Kits de Insumos ──> Dispensação
             │         ├── 1:N [Diagnostico] (CID-10 Principal + Hipóteses)
             │         ├── 1:N [Evolucao] (Médica, Enfermagem, Multiprofissional)
             │         ├── 1:N [RequisicaoExame] (Laboratório / Imagem)
             │         └── 1:N [Encaminhamento] (Ambulatório ou INTERNAÇÃO)
             ├── 1:1 [Leito] (Livre -> Ocupado -> Higienização)
             ├── 1:1 [FichaInternacaoAlta] (Condições de Alta + Declaração de Óbito)
             ├── 1:1 [FichaInternacaoObstetrica] (Partograma, DUM, BCF, Dilatação)
             └── 1:1 [FichaBercario] (Cuidados e Aprazamento Neonatal)
```

### 11.1. Ciclo Integrado de Prescrição, Kits e Dispensação:
1. O **Médico** prescreve um procedimento (ex: *Curativo Especial Grau 3* ou *Sondagem Vesical de Demora*).
2. O sistema vincula automaticamente o **Kit de Insumos** correspondente cadastrado no hospital (ex.: Sonda Foley, Bolsa Coletora, Seringa 20ml, Água Destilada, Luva Estéril, Clorexidina).
3. A **Farmácia** recebe a solicitação em `/farmacia/dispensacao` identificando o leito/paciente e os materiais componentes do kit.
4. O Farmacêutico confere e clica em *Dispensar*, que debita os lotes pelo critério FEFO/PEPS e libera os insumos para a Enfermagem executar o procedimento.

### 11.2. Ciclo Integrado de Admissão, Internação e Desfecho:
1. O **Médico do PS** indica *Internação* no Encaminhamento do atendimento.
2. O status do atendimento muda para `AGUARDANDO_INTERNACAO`.
3. O posto de **Admissões de Leitos** visualiza a solicitação, seleciona um leito com status `LIVRE` e confirma a admissão.
4. O leito passa para status `OCUPADO`, vinculando paciente, médico assistente e abrindo os workspaces `/prontuario/[id]` e `/evolucoes/[id]`.
5. Durante o internamento, médico e enfermagem registram evoluções diárias, aprazamentos e laudo AIH.
6. Na melhora clínica, o **Médico** acessa a aba `CONDICOES_ALTA` no Prontuário Médico, preenche o diagnóstico definitivo, seleciona o motivo e clica em **Concluir Alta**.
7. O atendimento é finalizado (`status = 'ALTA'`), e o leito é alterado automaticamente para status `HIGIENIZACAO`.

---

## 12. CRÍTICAS, TRAVAS DE SEGURANÇA E VALIDAÇÕES DO SISTEMA

O SGH implementa críticas ativas em tempo real para impedir falhas de assistência, erros de medicação e inconformidades regulatórias:

### 12.1. Travas Clínicas e de Atendimento:
- **Trava de Alta com Medicação Pendente no PS:** O sistema impede o médico de finalizar a consulta se houver medicação prescrita para uso no PS que ainda esteja com status `PENDENTE` de aplicação pela enfermagem. Após a aplicação, o sistema exige o registro da **Evolução Pós-Medicação** antes de liberar o botão *Finalizar Atendimento*.
- **Trava de Prontuário Encerrado (Imutabilidade CFM):** Atendimentos com status `CONCLUIDO`, `ALTA`, `OBITO` ou `TRANSFERIDO` tornam-se imediatamente somente-leitura. Nenhuma nova prescrição, evolução ou diagnóstico pode ser sobrescrito, preservando o valor jurídico do prontuário.
- **Trava de Concessão de Alta (RBAC Restrito):** A gravação das Condições de Alta e o encerramento da internação são bloqueados no backend para perfis que não sejam `MEDICO`, `DIRETOR_CLINICO` ou `ADMIN`. O botão não é exibido e a API retorna `403 Forbidden`.
- **Trava de Elegibilidade Obstétrica:** A flag obstétrica e os acessos às fichas `/internacao-obstetrica` e `/bercario` exigem validação de sexo biológico `FEMININO`. O sistema impede a ativação para pacientes do sexo masculino.

### 12.2. Travas de Farmácia e Estoque:
- **Bloqueio de Itens Vencidos:** Medicamentos com data de validade ultrapassada são bloqueados automaticamente para prescrição médica e dispensação farmacêutica.
- **Rastreabilidade Obrigatória de Lote:** Nenhuma entrada ou saída de medicamento pode ser realizada sem o número do lote e data de expiração.
- **Alerta de Estoque Mínimo:** Ao atingir o ponto de reposição, o item é sinalizado em vermelho na listagem para compras imediatas.

### 12.3. Travas de Cadastro e Recepção:
- **Validação Algorítmica de CPF:** Aplica validação de Módulo 11 nos 11 dígitos do CPF para bloquear documentos falsos ou com erros de digitação.
- **Validação de Cartão SUS:** Exige 15 dígitos numéricos válidos para garantir integração com BPA e AIH do DataSUS.
- **Alerta de Duplicidade no Dia:** Caso seja aberto um atendimento para um paciente que já possui atendimento em aberto na data, o sistema emite aviso sonoro/visual para evitar abertura de fichas duplicadas.

### 12.4. Travas de Leitos e Hospitalização:
- **Bloqueio de Dupla Ocupação:** Um leito com status `OCUPADO` ou `INTERDITADO` não pode receber nova admissão.
- **Transição Obrigatória de Higienização:** Um leito desocupado após alta médica não pode ser diretamente ocupado até que o serviço de hotelaria/limpeza confirme a higienização do leito no mapa.

---

## 13. INTELIGÊNCIA CLÍNICA E ASSISTENTE NA EVOLUÇÃO MÉDICA OBSTÉTRICA

O SGH conta com um **Módulo Especializado de Assistência Obstétrica de Alta Performance** (`FormularioEvolucao.tsx`), desenhado sob o princípio de **Zero Redundância de Dados (Single Source of Truth)**.

### 13.1. Autopreenchimento Inteligente e Sincronização em Tempo Real:
Ao abrir a evolução médica de uma paciente obstétrica (no PS ou na Enfermaria de Internação), o sistema sincroniza automaticamente:
1. **DUM & Idade Gestacional (IG):** Extrai a data da última menstruação registrada na Admissão/Ficha Obstétrica e calcula instantaneamente a IG precisa em semanas e dias até a data de hoje.
2. **Paridade (GPA):** Formata automaticamente o histórico reprodutivo (ex.: `G3P2A0`) a partir da anamnese obstétrica.
3. **Sinais Vitais:** Importa Pressão Arterial, Frequência Cardíaca e Temperatura corporal aferidos na Triagem ou na última checagem de enfermagem.
4. **Parâmetros de Partograma:** Puxa a última dilatação cervical, apagamento, apresentação/De Lee e BCF auscultado.
5. **Reconhecimento de Puerpério:** Detecta automaticamente se o parto já foi realizado (via data/hora do parto ou tabela de puerpério), exibindo a insígnia `🤱 Paciente em Puerpério` e sugerindo a conduta pós-parto imediato.

### 13.2. Modelos Especializados com Interpolação Dinâmica (1-Clique):
Diferente de modelos estáticos com espaços em branco, os botões de 1-clique geram textos completos **já preenchidos com os dados reais da paciente**:
- **🤰 Trabalho de Parto (Fase Ativa):** Injeta IG atual, sinais vitais, BCF com checagem de arritmia, contrações de dinâmica uterina, dilatação, De Lee, bolsa e abertura de partograma.
- **⏱️ Fase Latente / Admissão:** Injeta parâmetros de colo posterior/móvel, dinâmica incipiente e plano de reavaliação.
- **💧 Rotura Prematura (RUPREME):** Injeta IG, BCF, ausência de sinais de corioamnionite e protocolo de vigilância / antibioprofilaxia.
- **⚠️ Pré-Eclâmpsia / Síndrome Hipertensiva:** Injeta PA atual, ausência/presença de sinais premonitórios e conduta para rastreio laboratorial.
- **🩺 Avaliação de Vitalidade Fetal:** Injeta BCF sonar/cardiotoco, movimentação fetal e acelerações transitórias.
- **🤱 Puérpera - Parto Vaginal (D1/D2):** Injeta involução uterina (Pinard), características dos lóquios, integridade do períneo e amamentação.
- **🏥 Puérpera - Pós-Cesariana (D1/D2):** Injeta dados da ferida operatória, ruídos hidroaéreos, diurese e deambulação precoce.

---

## 14. SEGREGAÇÃO ESTRITA: MEDICAÇÃO DO PRONTO-SOCORRO (PS) VS. INTERNAMENTO HOSPITALAR

O SGH adota uma arquitetura de **isolamento clínico total** entre as medicações administradas no atendimento de urgência/emergência (Pronto-Socorro) e as medicações prescritas para pacientes em regime de internação hospitalar (Enfermaria / Leitos).

### 14.1. Medicação do Pronto-Socorro (PS) — Rota `/medicacao`:
- **Público:** Destinado exclusivamente a pacientes ambulatoriais e de pronto atendimento (`AGUARDANDO_ATENDIMENTO`, `EM_ATENDIMENTO`, `CONCLUIDO`) que estão na sala de medicação rápida do PS.
- **Fila de Espera:** Lista apenas prescrições do tipo `PS`.
- **Filtro de Bloqueio Automático:** Pacientes com status `INTERNADO`, `AGUARDANDO_INTERNACAO`, com leito atribuído (`leitoId`) ou flag de internação médica ativada (`vaiInternar`) **são omitidos 100% da fila da sala de medicação do PS**.
- **Acesso Direto Bloqueado:** Se um profissional tentar acessar a rota `/medicacao/[atendimentoId]` de um paciente internado, o sistema exibe um aviso explicativo e oferece botão de redirecionamento para o Prontuário de Internação da Enfermagem.
- **Validação de Backend:** A rota de aplicação (`/api/atendimento/[id]/aplicacao`) rejeita qualquer tentativa de aplicação via contexto `medicacao` para pacientes internados, retornando `HTTP 403 Forbidden`.

### 14.2. Medicação da Internação Hospitalar — Rota `/evolucoes/[atendimentoId]`:
- **Público:** Pacientes admitidos em leitos hospitalares.
- **Administração Beira-Leito:** O controle de doses, aprazamento (horários de 24h/48h), checagem de enfermagem e balanço é feito exclusivamente dentro da aba **Instruções / Enfermagem** (`AbaInstrucoesEnfermagem.tsx`) no Prontuário de Internação do paciente.
- **Rastreabilidade e Segurança:** Assegura que prescrições hospitalares complexas (antibioticoterapia contínua, analgésicos aprazados, hidratação venosa) não se misturem com a fila de procedimentos rápidos da sala de medicação da porta de entrada do PS.

---
*Manual técnico e operacional consolidado para o SGH v2.7.24.*


