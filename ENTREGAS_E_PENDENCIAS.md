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

## 3. O que falta ou está incompleto (priorizado)

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

## 4. Riscos e débito técnico conhecidos

- **Campo `resumoClinco`** no modelo `Encaminhamento` (typo histórico no Prisma): mantido por consistência com o banco; renomear exige migration + ajuste em toda a stack.
- **Múltiplas instâncias `next dev`** — Podem causar “Failed to fetch” no cliente; operação deve usar **uma** porta/instância por projeto.
- **Dependência de Pusher / `.env`** — Painel e filas degradam com fallback; ambiente sem credenciais precisa de checklist de deploy.
- **PDFs em `public/uploads/exames`** — Qualquer URL conhecida pode ser aberta sem sessão; em produção usar armazenamento privado e entrega autenticada.

---

## 5. Próximos passos sugeridos (ordem prática)

1. ~~**Exames — PDF**~~ — Upload por item + link público estático (em produção: bucket privado + URL assinada ou proxy autenticado).
2. ~~**Relatório PDF útil**~~ — Atendimentos do dia em `/relatorios`; evoluir para filtros por setor e mais indicadores.
3. Completar **manifest** com ícones e validar instalação em Android/Chrome.
4. **Auditoria**: filtros por data, entidade, usuário; export CSV para compliance.
5. **Política fina de doses** — Se necessário: limite por `duracaoDias` / alerta quando exceder prescrição (regra de negócio clínica).

---

## 6. Como validar rapidamente

```bash
npm run db:migrate   # se schema mudou noutra máquina
npm run test:run     # inclui sessao4.test.ts
npm run build
```

Rotas novas relevantes: `/enfermagem`, `/prontuario`, `/auditoria`, `/relatorios`; APIs sob `/api/atendimento/[id]/…` e `/api/relatorios/atendimentos-dia` conforme `README.md`.

---

*Última atualização: inclui `pdf-lib`, upload de resultado em PDF nos exames e relatório diário de atendimentos.*
