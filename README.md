# SGH — Sistema de Gerenciamento Hospitalar

Sistema hospitalar completo para unidades de urgência/emergência e internação: recepção, triagem (Protocolo de Manchester), atendimento médico, prescrição, farmácia hospitalar, internação e prontuário eletrônico — com trilha de auditoria, criptografia de dados sensíveis e painel de chamadas em tempo real.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Linguagem | TypeScript 5 |
| Banco | PostgreSQL + Prisma 7 (adapter `pg`) |
| Autenticação | NextAuth 4 (JWT 8h) + RBAC |
| Tempo real | Pusher (WebSockets) com fallback por polling |
| UI | Tailwind CSS 3 + Radix UI + shadcn |
| Formulários | React Hook Form + Zod |
| PDF | pdf-lib |
| E-mail | Nodemailer (SMTP configurável) |
| Testes | Vitest + Testing Library |

---

## Estado atual dos módulos

| Módulo | Rota | Status |
|--------|------|--------|
| Recepção / Ficha do paciente | `/recepcao` | ✅ Cadastro multi-etapa, edição, ViaCEP, upload de documentos |
| Triagem — Protocolo Manchester | `/triagem` | ✅ Classificação por cor, sinais vitais, IMC, discriminadores |
| Painel de chamada (TV) | `/painel` | ✅ Tela cheia, voz, mídia rotativa, múltiplos setores |
| Atendimento médico | `/atendimento` | ✅ Anamnese, CID-10, prescrição, evolução, exames, encaminhamentos |
| Medicação (PS, não internados) | `/medicacao` | ✅ Fila + aplicação com checklist dos 5 certos |
| Internamento | `/internamento` | ✅ Admissões, evolução por turno, sinais vitais 24h, SAE, multidisciplinar, CCIH, obstetrícia, berçário |
| Farmácia hospitalar | `/farmacia` | ✅ Catálogo, lotes (FEFO), entrada por NF-e (XML), dispensação, matriz de interações |
| Prontuário eletrônico | `/prontuario` | ✅ Busca de atendimentos + histórico consolidado |
| Evoluções | `/evolucoes` | ✅ Registro cronológico multiprofissional |
| Auditoria (LGPD) | `/auditoria` | ✅ Logs imutáveis (admin) |
| Cadastros | `/cadastros` | ✅ Leitos, clínicas, origens, prescrições-padrão |
| Configurações | `/configuracoes` | ✅ Instituição, painel, SMTP |
| Relatórios | `/relatorios` | ✅ PDF de atendimentos do dia |

---

## Como iniciar

### 1. Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha **obrigatoriamente**:

| Variável | Como gerar / obter |
|----------|--------------------|
| `DATABASE_URL` | `postgresql://postgres:senha@127.0.0.1:5432/sgh_db` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` (exatamente 64 caracteres hex) |
| `PUSHER_APP_ID` / `PUSHER_KEY` / `PUSHER_SECRET` / `PUSHER_CLUSTER` | Criar app gratuito em [pusher.com](https://pusher.com) |
| `NEXT_PUBLIC_PUSHER_KEY` / `NEXT_PUBLIC_PUSHER_CLUSTER` | Mesmos valores do servidor |

Opcionais: `UPLOAD_DIR`, `MAX_FILE_SIZE`, dados do hospital (`HOSPITAL_*`), `LOG_LEVEL`.

### 2. Banco de dados

```bash
# Com Docker (recomendado)
npm run db:compose:up      # sobe Postgres via docker-compose
npm run db:push            # aplica o schema
npm run db:seed            # popula usuários iniciais

# Ou com Postgres local já instalado
npm run db:bootstrap       # cria banco + aplica migrations + seed
```

### 3. Iniciar

```bash
npm run dev
```

Acesse http://localhost:3000

### Usuários iniciais (seed)

| E-mail | Senha | Role |
|--------|-------|------|
| admin@hospital.com | Sgh@2024! | ADMIN |
| medico@hospital.com | Sgh@2024! | MEDICO |
| enfermeiro@hospital.com | Sgh@2024! | ENFERMEIRO |
| recepcao@hospital.com | Sgh@2024! | RECEPCIONISTA |
| diretor@hospital.com | Sgh@2024! | DIRETOR_CLINICO |

> ⚠️ Troque todas as senhas antes de qualquer uso em produção.

---

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Garante o banco e sobe o servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run build:instalador` | Build + empacota release + gera instalador Windows |
| `npm test` | Testes unitários (Vitest, watch) |
| `npm run test:run` | Testes em modo CI (single-run) |
| `npm run db:migrate` | Migrations em desenvolvimento |
| `npm run db:migrate:deploy` | Migrations em produção |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | Popula usuários iniciais |
| `npm run smoke:rbac` | Smoke test das permissões por role |
| `npm run lint` | ESLint |

---

## Papéis de acesso (RBAC)

`ADMIN` · `MEDICO` · `ENFERMEIRO` · `TECNICO_ENFERMAGEM` · `RECEPCIONISTA` · `DIRETOR_CLINICO` · `FARMACEUTICO`

As permissões são verificadas no middleware (proteção de rotas) e em cada endpoint via `getServerSession`.

---

## Segurança

- Dados sensíveis do paciente (CPF, RG, nome, telefone) criptografados com **AES-256-GCM**; hash do CPF para busca sem descriptografar.
- Trilha de auditoria imutável (append-only) — inclui log LGPD específico da farmácia.
- Soft delete nas entidades principais.
- Senhas com bcrypt; suporte a MFA/TOTP no modelo de usuário.
- JWT com expiração de 8h, sem dados sensíveis no token.
- O painel de chamadas (`/painel`) é público (para TVs) — recomenda-se rate limit na borda (nginx/Vercel Edge).

---

## O que falta / próximos passos

### Segurança e produção
- [ ] **MFA/TOTP** — o schema já tem `mfaSecret`/`mfaAtivo`, mas o fluxo de ativação e verificação no login ainda não está implementado.
- [ ] **Rate limiting** no painel público e nos endpoints de autenticação.
- [ ] Rotação de `ENCRYPTION_KEY` e estratégia de re-criptografia.
- [ ] Revisão de políticas de retenção/anonimização (LGPD).

### Testes e qualidade
- [ ] Ampliar cobertura: hoje há testes unitários focados (criptografia, CPF, Manchester, IMC, validações Zod da Sessão 4). Faltam testes de integração de API e testes E2E dos fluxos completos (recepção → triagem → atendimento → internação).
- [ ] Testes dos módulos de farmácia e internação (evolução por turno, SAE, CCIH, obstetrícia).
- [ ] CI configurado para rodar `test:run` + `lint` + `build`.

### Funcionalidades
- [ ] **PWA / offline** — dependências e estrutura existem, mas faltam ícones dedicados e service worker configurado.
- [ ] **FHIR R4** — o schema já reserva campos (ex.: `codigoTuss` em exames); integração/exportação ainda não implementada.
- [ ] Relatórios gerenciais além do "atendimentos do dia" (indicadores de fila, tempos por cor Manchester, ocupação de leitos).
- [ ] Importação/lançamento de resultados de exames vindos de laboratório (hoje é manual: texto + PDF anexado).
- [ ] Assinatura digital de prescrições e laudos.

### Infraestrutura
- [ ] Documentar o processo de deploy (VPS / Windows via instalador) em detalhe.
- [ ] Backup automatizado do banco e dos uploads.
- [ ] Observabilidade: métricas e alertas (hoje há logging com pino).

> Nota: há cerca de 200 marcadores `TODO`/pendências espalhados no código-fonte — vale uma varredura dedicada (`grep -ri "TODO"`) para priorizar os itens acima com base nos pontos já sinalizados pela equipe.

---

## Estrutura do projeto

```
sgh/
├── app/
│   ├── (auth)/login/            # Login
│   ├── (dashboard)/             # Área protegida (NextAuth + RBAC)
│   │   ├── recepcao/            # Cadastro e ficha do paciente
│   │   ├── triagem/             # Protocolo de Manchester
│   │   ├── atendimento/         # Mesa médica
│   │   ├── medicacao/           # Medicação PS
│   │   ├── internamento/        # Internação + fichas
│   │   ├── farmacia/            # Farmácia hospitalar
│   │   ├── prontuario/          # Busca / histórico
│   │   ├── evolucoes/           # Evolução multiprofissional
│   │   ├── cadastros/           # Leitos, clínicas, origens, modelos
│   │   ├── configuracoes/       # Instituição, painel, SMTP
│   │   ├── auditoria/           # Logs (admin)
│   │   └── relatorios/          # PDF
│   ├── painel/                  # Painel de chamadas (rota pública, TV)
│   └── api/                     # Rotas de API por domínio
├── components/                  # UI por módulo + componentes compartilhados (ui/)
├── lib/                         # Regras de negócio, integrações e helpers
│   ├── auth.ts, encryption.ts, prisma.ts, pusher.ts
│   ├── farmacia-*, internacao-*, ficha-*, evolucao-*
│   └── validations/             # Schemas Zod
├── prisma/
│   ├── schema.prisma            # 53 modelos + 25 enums
│   ├── migrations/
│   └── seed.ts
├── scripts/                     # Setup de banco, release, instalador Windows
└── tests/unit/                  # Vitest
```
