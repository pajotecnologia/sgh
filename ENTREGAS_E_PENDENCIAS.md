# SGH — Entregas recentes e pendências

Documento gerado para alinhar **o que já está no repositório** com **o que ainda faz sentido evoluir**. Tom técnico direto: prioridade, risco e próximo passo sugerido.

---

## 1. Resumo executivo

As **sessões 4, 5 e 6** descritas no `README.md` foram **implementadas em base funcional**: APIs persistidas no Prisma, fluxos na UI onde couber, RBAC revisado em pontos críticos (prontuário vs. enfermagem), testes unitários adicionais para a sessão 4, manifest PWA mínimo e páginas de consulta/auditoria.

O sistema **não está “fechado” para produção hospitalar completa**: faltam integrações típicas (resultado de exame estruturado, PDFs gerenciais, hardening operacional). Isso é esperado num MVP evolutivo.

---

## 2. O que foi feito (consolidado)

### 2.1 Sessão 4 — Medicação, exames, evolução, encaminhamento

| Área | Entrega |
|------|---------|
| **Validação** | Zod: checklist dos 5 certos, aplicação, requisição de exames (categoria, urgência, itens), encaminhamento. |
| **API** | `POST /aplicacao` (enfermagem + log); `GET/POST /exames`; `GET/POST /encaminhamento`; `GET/POST /evolucao` com validação de `prontuarioId` × `atendimentoId`. |
| **Segurança** | `prontuarioPertenceAoAtendimento` reutilizado em prescrição e diagnóstico; evolução alinhada ao mesmo critério. |
| **Prontuário GET** | Inclui requisições de exames, aplicações por item; roles de leitura para enfermagem; início automático de atendimento **apenas** para perfil clínico (evita enfermeiro assumir `medicoId`). |
| **UI médica** | Abas Evolução, Exames, Encaminhamentos (formulários já existentes, integrados às rotas). |
| **UI enfermagem** | `/enfermagem` (fila com itens pendentes) e `/enfermagem/[atendimentoId]` com formulário de aplicação (5 certos). |
| **RBAC extra** | `DIRETOR_CLINICO` em prescrição/diagnóstico onde aplicável. |

### 2.2 Sessão 5 — Prontuário e auditoria

| Área | Entrega |
|------|---------|
| **`/prontuario`** | Busca por número de atendimento ou nome; links para workspace médico, enfermagem e ficha de impressão (conforme role). |
| **`/auditoria`** | Listagem dos últimos registros de `LogAuditoria` (somente ADMIN). |

### 2.3 Sessão 6 — Testes, PWA, relatórios

| Área | Entrega |
|------|---------|
| **Testes** | `tests/unit/sessao4.test.ts` (checklist + schema de aplicação). |
| **PWA** | `app/manifest.ts` — metadados instaláveis; **sem** ícones dedicados em `public` (instalação genérica no browser). |
| **Relatórios** | `/relatorios`: download PDF **atendimentos do dia** (`GET /api/relatorios/atendimentos-dia?data=`), `pdf-lib`, roles ADMIN / DIRETOR_CLINICO. |
| **Exames — PDF** | `POST .../exames/item/[itemId]/pdf` (multipart), gravação em `public/uploads/exames/`, campo `resultadoPdf`; UI na aba Exames (anexar + link). |

### 2.4 Outros ajustes já incorporados (contexto anterior deste projeto)

- Ficha de urgência compartilhada (`FichaUrgenciaDocumento`), impressão médica preenchida, painel de chamadas (áudio/desbloqueio/Pusher), botões de chamada no atendimento médico, etc. (detalhe fino no histórico de commits / `README`.)

---

## 3. Fase de segurança/LGPD concluída nesta rodada

- Auditoria administrativa com filtros por período, usuário, ação, entidade e busca textual.
- Exportação CSV da trilha de auditoria com controle por `ADMIN`/`DIRETOR_CLINICO`.
- `LogAcessoPaciente` passou a ser alimentado pelo helper LGPD também nos acessos de prontuário e por paciente direto.
- Rate limiting de credenciais (8 tentativas por IP/e-mail em 15 minutos) e registro de tentativas de login.
- Rate limiting do endpoint público de configuração do painel.
- Cadastro, consulta e mudança de status de solicitações de titulares LGPD, com protocolo e auditoria.
- Migration Prisma para `SolicitacaoTitular` e índices de consulta da auditoria.
- CI agora executa testes unitários antes de TypeScript/build.

## 4. O que falta ou está incompleto (priorizado)

### Alta prioridade (dados e segurança)

1. ~~**Exames — resultado**~~ — Implementado: `PATCH /api/atendimento/[id]/exames/item/[itemId]` + formulário por item na aba Exames.
2. ~~**Aplicação — múltiplas doses**~~ — Permitidas novas aplicações com item já `APLICADO` (histórico em `AplicacaoMedicamento`); status do item só muda na primeira vez.
3. ~~**Anamnese — diretor**~~ — `DIRETOR_CLINICO` pode gravar anamnese (alinhado a prescrição/diagnóstico).
4. **Demais rotas com `prontuarioId` no body** — Revisar outras APIs (se surgirem) com o mesmo padrão `prontuarioPertenceAoAtendimento`.

### Média prioridade (produto e UX)

5. **Relatórios PDF** — Há relatório **atendimentos do dia**; faltam outros relatórios gerenciais, templates institucionais (logo/cores) e agendamento/export em lote.
6. **PWA completo** — Faltam **ícones** (`icons` no manifest), eventual `service worker` / estratégia offline (Next não inclui SW por padrão; avaliar `next-pwa` ou equivalente com consciência de cache).
7. **Prontuário “eletrônico” amplo** — A página `/prontuario` é **busca de atendimentos**, não um PEP longitudinal por paciente (vários atendimentos agregados, timeline clínica, exportação FHIR, etc.).

### Baixa prioridade / operação

8. **Testes E2E / integração** — Vitest cobre trechos; não há suite Playwright/Cypress para fluxos críticos (login → triagem → prescrição → aplicação).
9. **Rate limit e hardening** — README já menciona rate limit no painel público; não implementado no código deste repositório.
10. **Internacionalização / acessibilidade** — Revisão formal (WCAG) não foi escopo desta entrega.

---

## 6. Fase 5 — Sessões, dispositivos e revogação de acesso

- Tabela existente `SessaoUsuario` passou a ser integrada ao JWT do NextAuth sem trocar a estratégia `jwt`.
- Cada login válido cria uma sessão persistida com identificador aleatório armazenado somente como hash SHA-256.
- Sessões carregam IP, user-agent, dispositivo, criação, último acesso e expiração.
- O JWT passa a carregar apenas o identificador da sessão; o servidor valida a sessão persistida a cada renovação/acesso do JWT.
- Sessões revogadas, expiradas ou vinculadas a usuário inativo deixam de ser aceitas.
- Logout normal revoga a sessão atual no banco.
- Nova tela `/seguranca/sessoes` permite consultar sessões/dispositivos ativos e encerrar acessos individuais ou todas as outras sessões.
- Novas APIs de segurança para listar, revogar uma sessão e revogar as demais sessões.
- Atualização do menu lateral para acesso à gestão de sessões por qualquer usuário autenticado.
- Testes unitários para geração/hash de identificador, duração de sessão e identificação de dispositivo.

## 5. Fase 4 concluída nesta rodada — MFA e segurança de conta

- TOTP compatível com aplicativos autenticadores, sem nova dependência externa.
- Segredo TOTP criptografado com AES-256-GCM usando chave derivada de `NEXTAUTH_SECRET`.
- Ativação somente após validação do primeiro código.
- Login passa a exigir código MFA para contas com MFA ativo.
- Registro de eventos `MFA_ATIVADO`, `MFA_DESATIVADO`, `MFA_CODIGO_AUSENTE`, `MFA_CODIGO_INVALIDO` e `MFA_VALIDADO`.
- Tela `/seguranca/mfa` para configuração e desativação mediante código atual.
- Testes unitários das primitivas TOTP.


## Fase 6 — Armazenamento privado e hardening de dependências

- Arquivos clínicos em `/api/uploads/exames/*` agora exigem autenticação **e autorização no recurso persistido**: a URL só é servida quando o PDF está vinculado a um `ItemRequisicao` existente e a um atendimento ativo.
- O proxy de arquivos deixou de tratar apenas a extensão como critério suficiente: o namespace `exames/` permanece privado mesmo se o arquivo tiver extensão de imagem.
- Acesso a resultado de exame é registrado na auditoria LGPD com usuário, atendimento, paciente, IP, user-agent e entidade do recurso.
- Upload de mídia institucional deixou de usar o nome original como identificador físico; novos arquivos recebem UUID + extensão para reduzir previsibilidade e colisões.
- Foi adicionada política do Dependabot em `.github/dependabot.yml` para atualizações semanais de dependências npm e GitHub Actions, agrupando updates minor/patch.
- Não foi aplicado `npm audit fix --force`: atualizações maiores/transitivas devem ser avaliadas individualmente para preservar compatibilidade com Next.js 16, React 19 e Prisma 7.

## 6. Riscos e débito técnico conhecidos

- **Campo `resumoClinco`** no modelo `Encaminhamento` (typo histórico no Prisma): mantido por consistência com o banco; renomear exige migration + ajuste em toda a stack.
- **Múltiplas instâncias `next dev`** — Podem causar “Failed to fetch” no cliente; operação deve usar **uma** porta/instância por projeto.
- **Dependência de Pusher / `.env`** — Painel e filas degradam com fallback; ambiente sem credenciais precisa de checklist de deploy.
- **PDFs em `public/uploads/exames`** — Qualquer URL conhecida pode ser aberta sem sessão; em produção usar armazenamento privado e entrega autenticada.

---

## 7. Próximos passos sugeridos (ordem prática)

1. ~~**Exames — PDF**~~ — Upload por item + link público estático (em produção: bucket privado + URL assinada ou proxy autenticado).
2. ~~**Relatório PDF útil**~~ — Atendimentos do dia em `/relatorios`; evoluir para filtros por setor e mais indicadores.
3. Completar **manifest** com ícones e validar instalação em Android/Chrome.
4. ~~**Auditoria**: filtros por data, entidade, usuário; export CSV para compliance.~~ — Concluído nesta rodada.
5. **Política fina de doses** — Se necessário: limite por `duracaoDias` / alerta quando exceder prescrição (regra de negócio clínica).

---

## 9. Como validar rapidamente

```bash
npm run db:migrate   # se schema mudou noutra máquina
npm run test:run     # inclui testes unitários de sessões, TOTP e fluxos anteriores
npm run build
```

Rotas novas relevantes: `/enfermagem`, `/prontuario`, `/auditoria`, `/relatorios`, `/seguranca/mfa`, `/seguranca/sessoes`; APIs sob `/api/atendimento/[id]/…` e `/api/relatorios/atendimentos-dia` conforme `README.md`.

---

*Última atualização: inclui a Fase 5 de controle de sessões/dispositivos e revogação de acessos.*


## Fases 7–10 — bloco de endurecimento operacional

### Fase 7 — Dependências
- Criado `npm run security:audit` para relatório automatizado de vulnerabilidades.
- Dependabot já monitora npm e GitHub Actions.
- Não foi aplicado `npm audit fix --force`; a atualização de major/lockfile continua exigindo validação coordenada para não quebrar Next.js 16/React 19/Prisma 7.

### Fase 8 — RBAC clínico contextual
- Criada política central em `lib/rbac-clinico.ts`.
- Médico comum passa a ser limitado ao atendimento que está atribuído a ele nas APIs clínicas endurecidas.
- Diagnóstico DELETE agora exige `atendimentoId` e verifica que o diagnóstico pertence ao prontuário daquele atendimento.
- APIs de prescrição, diagnóstico e evolução verificam atendimento ativo + vínculo do médico antes da operação.
- Testes unitários adicionados para leitura/edição, vínculo médico-atendimento e estados encerrados.

### Fase 9 — Backup e recuperação
- Criado backup PostgreSQL em formato custom + backup dos uploads.
- Manifesto SHA-256 é gerado para os artefatos.
- Restauração exige `CONFIRM_RESTORE=YES`, reduzindo risco de execução destrutiva acidental.
- A restauração valida o manifesto antes de executar `pg_restore`.

### Fase 10 — Regressão E2E
- CI recebeu job PostgreSQL isolado para smoke test RBAC.
- O job prepara banco, gera Prisma, executa seed, gera build, sobe a aplicação e executa `npm run test:smoke`.
- Falhas do smoke exibem o log da aplicação para diagnóstico.
