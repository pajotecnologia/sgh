# SGH — Sistema de Gerenciamento Hospitalar

## Módulos Implementados

| Sessão | Módulo | Status |
|--------|--------|--------|
| 1 | Recepção / Ficha do Paciente | ✅ Completo |
| 2 | Triagem — Protocolo Manchester | ✅ Completo |
| 2 | Painel de Chamada (tela cheia) | ✅ Completo |
| 3 | Atendimento Médico (Anamnese, CID-10, Prescrição) | ✅ Completo |
| 4 | Aplicação de Meds, Exames, Evolução, Encaminhamentos | ✅ Completo (API + UI médico + `/enfermagem`) |
| 5 | Prontuário Eletrônico + Auditoria | ✅ Base (`/prontuario`, `/auditoria`) |
| 6 | Testes, PWA, Relatórios PDF | ✅ Parcial (`pdf-lib`: relatório diário + upload PDF em exames; PWA sem ícones dedicados) |

---

## 🚀 Como Iniciar

### 1. Configurar variáveis de ambiente

```bash
copy .env.example .env
```

Edite o `.env` e preencha **obrigatoriamente**:

| Variável | Como gerar |
|----------|-----------|
| `DATABASE_URL` | `postgresql://postgres:senha@localhost:5432/sgh_db` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` (64 chars hex) |
| `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` | Criar em pusher.com (gratuito) |
| `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` | Mesmos valores do servidor |

### 2. Criar banco e rodar migrations

```bash
npm run db:migrate
```

### 3. Popular usuários iniciais

```bash
npm run db:seed
```

| E-mail | Senha | Role |
|--------|-------|------|
| admin@hospital.com | Sgh@2024! | ADMIN |
| medico@hospital.com | Sgh@2024! | MEDICO |
| enfermeiro@hospital.com | Sgh@2024! | ENFERMEIRO |
| recepcao@hospital.com | Sgh@2024! | RECEPCIONISTA |
| diretor@hospital.com | Sgh@2024! | DIRETOR_CLINICO |

> ⚠️ Troque as senhas imediatamente em produção!

### 4. Iniciar

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 📁 Estrutura do Projeto

```
sgh/
├── app/
│   ├── (auth)/login/             # Tela de login premium
│   ├── (dashboard)/              # Área protegida por NextAuth
│   │   ├── layout.tsx            # Sidebar + Header por role
│   │   ├── dashboard/            # Visão geral + stats do dia
│   │   ├── recepcao/             # Módulo 1 ✅
│   │   │   └── novo/             # Cadastro multi-step 4 etapas
│   │   ├── triagem/              # Módulo 2 ✅
│   │   │   └── [atendimentoId]/  # Formulário de triagem individual
│   │   ├── atendimento/          # Módulo 3 + Sessão 4 ✅
│   │   │   ├── [atendimentoId]/  # Workspace (Anamnese, CID, Prescrição, Evolução, Exames, Encaminhamentos)
│   │   │   └── imprimir/         # Ficha preenchida (médico)
│   │   ├── enfermagem/          # Sessão 4 — aplicação de medicamentos ✅
│   │   ├── prontuario/           # Sessão 5 — busca de atendimentos ✅
│   │   ├── auditoria/          # Sessão 5 — logs (admin) ✅
│   │   └── relatorios/           # Sessão 6 — PDF atendimentos do dia (admin/diretor)
│   ├── painel/                   # Módulo 3 ✅ (rota pública, tela cheia)
│   ├── acesso-negado/            # Página de erro de permissão
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth
│       ├── pacientes/            # GET (busca+paginação) + POST (cadastro)
│       ├── triagem/              # POST (registrar) + fila/GET (fila tempo real)
│       ├── atendimento/          # Mesa médica + Sessão 4
│       │   └── [atendimentoId]/
│       │       ├── prontuario/   # GET (lazy creation; inclui exames e aplicações)
│       │       ├── anamnese/     # POST
│       │       ├── diagnostico/  # POST/GET
│       │       ├── prescricao/   # POST (alergias / interações)
│       │       ├── evolucao/     # GET/POST (append-only)
│       │       ├── exames/       # GET/POST + item PATCH (texto) + item/.../pdf POST
│       │       ├── encaminhamento/ # GET/POST
│       │       └── aplicacao/    # POST (5 certos — enfermagem)
│       ├── cid10/                # GET (Busca local)
│       ├── relatorios/           # GET atendimentos-dia?data= (PDF)
│       └── painel/
│           ├── chamar/           # POST (chamar + evento Pusher)
│           └── historico/        # GET (últimas N chamadas)
├── components/
│   ├── auth/FormularioLogin
│   ├── recepcao/FormularioCadastroPaciente
│   ├── triagem/
│   │   ├── BadgeManchester      # Badge 6 cores, 3 tamanhos
│   │   ├── CardPacienteEspera   # Tempo real + barra de progresso + alerta
│   │   ├── FilaTriagem          # Pusher + polling fallback + filtros
│   │   ├── FormularioTriagem    # Sinais vitais + IMC automático + slider dor
│   │   └── ModalChamarPaciente  # Grade de salas + setor de painel
│   ├── painel/PainelChamada     # Tela cheia TV + Pusher + relógio + som
│   ├── enfermagem/              # FormularioAplicacaoMedicamento (5 certos)
│   ├── ficha/FichaUrgenciaDocumento
│   └── shared/Sidebar, Header
├── lib/
│   ├── auth.ts                  # NextAuth + RBAC + JWT 8h
│   ├── encryption.ts            # AES-256-GCM
│   ├── cep.ts                   # ViaCEP
│   ├── attendance.ts            # Número de atendimento único
│   ├── pusher.ts                # Servidor + cliente + canais nomeados
│   ├── utils.ts                 # cn(), IMC, alertas Manchester
│   ├── cid10.ts                 # Base e busca CID-10 (Módulo 4)
│   ├── interacoes-medicamentosas.ts # Alergias e Interações (Módulo 4)
│   └── validations/
│       ├── paciente.ts          # Zod: CPF, endereço, saúde
│       ├── triagem.ts           # Zod: sinais vitais, chamada painel
│       └── atendimento.ts       # Zod: anamnese, prescrição, evolução
├── prisma/
│   ├── schema.prisma            # 20+ tabelas
│   └── seed.ts
├── types/index.ts               # Tipos centralizados + PROTOCOLO_MANCHESTER[]
├── middleware.ts                # Proteção de rotas por role
└── tests/unit/
    ├── sgh.test.ts              # AES, CPF, atendimento, IMC, Manchester
    ├── triagem.test.ts          # Triagem Zod, tempos Manchester, IMC completo
    └── atendimento.test.ts      # Alergias cruzadas, Interações, CID-10
```

---

## 🔌 Endpoints — Sessões 1 e 2

### Módulo 1 — Recepção

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| GET | `/api/pacientes?cpf=` | Todos | Busca por CPF (anti-duplicidade) |
| GET | `/api/pacientes?busca=&pagina=` | Todos | Lista paginada |
| POST | `/api/pacientes` | ADMIN, RECEPCIONISTA | Cadastrar paciente |

### Módulo 2 — Triagem

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| POST | `/api/triagem` | ADMIN, ENFERMEIRO | Registrar triagem + emite evento Pusher |
| GET | `/api/triagem/fila` | Todos | Fila de espera ordenada por prioridade |

### Módulo 3 — Painel de Chamada

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| POST | `/api/painel/chamar` | ADMIN, ENFERMEIRO, MEDICO | Chamar paciente + emite evento Pusher |
| GET | `/api/painel/historico?setor=` | Público | Últimas N chamadas (sem auth) |
| — | `/painel?setor=GERAL` | Público | Tela cheia para TVs da sala de espera |

### Módulo 4 — Atendimento Médico

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| GET | `/api/atendimento/[id]/prontuario` | ADMIN, MEDICO | Carrega/cria prontuário do atendimento |
| POST | `/api/atendimento/[id]/anamnese` | ADMIN, MEDICO | Salva/atualiza anamnese |
| POST | `/api/atendimento/[id]/diagnostico`| ADMIN, MEDICO | Adiciona CID-10 (gerencia flag principal) |
| POST | `/api/atendimento/[id]/prescricao` | ADMIN, MEDICO | Cria prescrição (avalia alergias/interações) |
| GET | `/api/cid10?q=` | Todos | Autocomplete CID-10 |
| GET/POST | `/api/atendimento/[id]/evolucao` | ADMIN, MEDICO, DIRETOR_CLINICO | Lista / nova evolução (imutável) |
| GET/POST | `/api/atendimento/[id]/exames` | GET: + ENFERMEIRO; POST: médico/admin/diretor | Requisições de exames |
| PATCH | `/api/atendimento/[id]/exames/item/[itemId]` | Clínica + enfermagem | Lançar/atualizar resultado em texto e data de realização |
| POST | `/api/atendimento/[id]/exames/item/[itemId]/pdf` | Clínica + enfermagem | Anexar PDF do resultado (`multipart/form-data`, campo `arquivo`; opcional `realizadoEm`) |
| GET/POST | `/api/atendimento/[id]/encaminhamento` | GET: + ENFERMEIRO; POST: médico/admin/diretor | Encaminhamentos |
| GET | `/api/relatorios/atendimentos-dia?data=YYYY-MM-DD` | ADMIN, DIRETOR_CLINICO | PDF com atendimentos criados nesse dia (hora local do servidor) |
| POST | `/api/atendimento/[id]/aplicacao` | ADMIN, ENFERMEIRO, TECNICO_ENFERMAGEM | Aplicação com checklist dos 5 certos |

---

## 🔴 Painel de Chamada — Como usar

1. Abrir `/painel?setor=GERAL` em uma TV ou monitor (qualquer navegador, tela cheia `F11`)
2. Suporta múltiplos painéis por setor: `/painel?setor=EMERGENCIA`, `/painel?setor=AMBULATORIO`
3. No dashboard, ao clicar "Chamar para atendimento" → selecionar sala → evento Pusher atualiza o painel instantaneamente
4. Histórico das últimas 4 chamadas exibido no rodapé
5. Toggle de som no canto superior direito
6. Status de conexão Pusher (verde = online, vermelho = offline com polling de fallback)

---

## 🧪 Testes

```bash
npm test
```

Cobertura total (Sessões 1 + 2): **25+ testes unitários**

- ✅ Criptografia AES-256-GCM
- ✅ Validação CPF (dígitos verificadores)
- ✅ Geração de número de atendimento
- ✅ Schema Zod de triagem (sinais vitais com limites fisiológicos)
- ✅ Protocolo Manchester — configuração das 6 cores
- ✅ Alertas de tempo por cor (LARANJA 10min, AMARELO 30min, etc.)
- ✅ Cálculo IMC — todos os 6 intervalos de classificação

---

## 🔐 Segurança

- Dados sensíveis criptografados com AES-256-GCM (CPF, RG, nome, telefone)
- JWT expira em 8h, sem dados sensíveis no token
- Trilha de auditoria imutável em toda criação/modificação
- Soft delete em todas as tabelas
- Roles verificadas em todos os endpoints via `getServerSession`
- Painel público com rate limit recomendado via Vercel Edge ou nginx
