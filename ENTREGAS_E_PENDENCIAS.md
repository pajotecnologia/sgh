# SGH — Entregas e Pendências

Documento de acompanhamento técnico e funcional do **SGH — Sistema de Gestão Hospitalar**, atualizado para o cenário prioritário de utilização na **rede pública de saúde**.

## 1. Resumo executivo

O núcleo operacional do SGH está implementado e validado no CI, incluindo triagem, atendimento médico, enfermagem, farmácia, internamento, mapa de leitos, prontuário longitudinal, auditoria/LGPD, segurança de contas, relatórios gerenciais e fluxos de regressão automatizados.

As sugestões da rodada anterior que faziam sentido para o produto **já estão implementadas no repositório**. Algumas existem como bibliotecas/regras de domínio e devem continuar evoluindo para integração de UI, APIs e fluxos conforme a operação real da unidade.

O direcionamento do produto foi ajustado: **não será desenvolvido módulo de faturamento hospitalar/SUS, AIH/BPA ou faturamento de saúde suplementar**. O foco é assistência, gestão operacional, segurança do paciente, regulação, informação clínica, interoperabilidade e gestão pública.

## 2. Entregas concluídas

### 2.1 Operação assistencial

- Minha Fila e busca global.
- Atalho de próximo paciente na triagem.
- Dashboard adaptado por perfil.
- Central de Tarefas com pendências acionáveis.
- Notificações de novas pendências críticas.
- Proteção de formulários com indicação de progresso e alerta de alterações não salvas.
- Triagem Manchester e filas operacionais.
- Farmácia e enfermagem integradas ao fluxo assistencial.
- Mapa visual de leitos, ocupação, transferência e interdição.
- Responsividade para operação em telas menores.

### 2.2 Prontuário e informação clínica

- Prontuário eletrônico longitudinal (PEP).
- Timeline de atendimentos, triagens, sinais vitais, diagnósticos, prescrições, exames e evoluções.
- Busca de prontuário.
- Exames estruturados com valores de referência e classificação NORMAL/ABAIXO/ACIMA/CRÍTICO.
- Upload e acesso protegido a laudos de exames.
- Evolução clínica.
- Encaminhamentos.
- Histórico de aplicações de medicamentos.
- Regras de vínculo entre prontuário e atendimento.

### 2.3 Segurança do paciente e protocolos clínicos

As principais sugestões clínicas da rodada anterior **já possuem implementação de domínio no repositório**:

- Protocolo de Sepse com qSOFA/SIRS.
- Protocolo de AVC com escala de Cincinnati e janela temporal.
- Protocolo de Dor Torácica/IAM.
- Escala de Braden.
- Escala de Morse.
- SBAR para passagem de plantão.
- Identificação do paciente por código de barras/QR Code.
- Checklist de Cirurgia Segura da OMS.
- Protocolo de Óbito.
- Alertas e regras de deterioração clínica.

**Próxima evolução:** validar cada protocolo com a rotina assistencial real da rede pública e ampliar sua integração às telas, registros, auditoria e indicadores, sem transformar o sistema em substituto de decisão clínica.

### 2.4 Regulação e operação pública

A base do NIR/regulação já está implementada:

- Solicitação de regulação.
- Integração conceitual com CROSS, SUSfácil, CER estadual e regulação municipal.
- Classificação de prioridade.
- Especialidade e tipo de vaga.
- Protocolo da central.
- Controle do tempo em regulação.
- Alerta para permanência superior a 24 horas.
- Controle de vaga, transporte e encerramento da solicitação.

**Próxima evolução:** transformar essa base em fluxo operacional completo de NIR, com telas, histórico, auditoria, indicadores e integrações externas somente quando houver API/credencial oficialmente disponível.

### 2.5 Gestão pública e indicadores

- Relatórios gerenciais.
- Indicadores de atendimento.
- Indicadores de classificação Manchester.
- Taxa de ocupação de leitos.
- Consumo farmacêutico.
- Exportação CSV/PDF.
- Relatório de atendimentos.
- Auditoria administrativa com filtros.
- Exportação da trilha de auditoria.
- Registro de acesso a dados de pacientes para LGPD.

### 2.6 Segurança, LGPD e controle de acesso

- MFA/TOTP.
- Sessões persistidas e revogáveis.
- Gestão de dispositivos.
- RBAC clínico contextual.
- Rate limiting.
- Auditoria.
- Criptografia de dados sensíveis.
- Proteção de documentos clínicos.
- Controle de acesso aos resultados de exames.
- Solicitações de titulares LGPD.
- Backup PostgreSQL e uploads.
- Manifesto SHA-256 dos backups.
- Processo de restauração com confirmação explícita.

### 2.7 PWA, qualidade e CI/CD

- Manifesto PWA completo.
- Ícones PWA.
- Testes unitários.
- Testes de regressão.
- Smoke test com PostgreSQL.
- Build de produção validado.
- TypeScript validado.
- Pipeline CI/CD executando testes antes do build.
- Dependabot para dependências npm e GitHub Actions.

## 3. Interoperabilidade — prioridade estratégica para a rede pública

O projeto já possui base de **HL7 FHIR R4**, incluindo mapeamento de:

- Patient.
- Observation.
- Encounter.
- Sinais vitais com códigos LOINC.
- Unidades UCUM.

Essa capacidade deve ser tratada como **prioridade de integração pública**, e não como simples recurso técnico.

Próximas evoluções possíveis:

1. APIs FHIR autenticadas.
2. Identificação consistente do paciente.
3. Mapeamento de CNS e demais identificadores oficiais.
4. Exportação/consulta controlada de Patient, Encounter e Observation.
5. Auditoria de interoperabilidade.
6. Integração somente com serviços oficiais e APIs efetivamente disponibilizadas pela rede pública.

## 4. O que ainda falta

### Alta prioridade

1. **Completar a integração dos protocolos clínicos com a operação**
   - registrar alertas no atendimento;
   - persistir avaliações quando necessário;
   - apresentar ações contextualizadas;
   - auditar acionamentos;
   - criar indicadores de protocolo.

2. **Evoluir o NIR/regulação**
   - tela operacional;
   - fila de solicitações;
   - filtros por prioridade/status;
   - histórico;
   - indicadores de tempo de espera;
   - controle de transporte;
   - auditoria.

3. **Fortalecer a identificação do paciente**
   - leitura de QR Code/código de barras;
   - conferência à beira-leito;
   - redução de risco de paciente errado;
   - registro de auditoria.

4. **Interoperabilidade FHIR**
   - transformar os mapeamentos existentes em endpoints e fluxos controlados;
   - autenticação;
   - auditoria;
   - políticas de acesso.

5. **Indicadores da rede pública**
   - tempo porta-atendimento;
   - tempo porta-médico;
   - tempo de espera;
   - ocupação;
   - permanência;
   - taxa de retorno;
   - perfil epidemiológico;
   - produção assistencial;
   - indicadores de regulação.

### Média prioridade

6. Evoluir gestão de documentos e termos eletrônicos.
7. Melhorar dashboards específicos para direção, enfermagem, farmácia, recepção e NIR.
8. Criar mais recursos de auditoria operacional.
9. Melhorar experiência mobile para uso em enfermagem e beira-leito.
10. Revisar continuamente as APIs que recebem identificadores de prontuário/atendimento.

### Baixa prioridade / evolução futura

11. Integrações externas adicionais, somente após definição dos serviços oficiais e credenciais da rede.
12. Automação avançada de indicadores.
13. Melhorias de PWA/offline onde forem clinicamente seguras.

## 5. Fora do escopo do produto

Por decisão de produto, **não fazem parte do roadmap atual**:

- Faturamento hospitalar.
- AIH.
- BPA.
- TISS/TUSS.
- Faturamento de convênios.
- Módulo financeiro hospitalar voltado à cobrança.
- Recursos cujo objetivo principal seja faturamento.

Isso evita direcionar o SGH para um modelo de hospital privado/convênios e mantém o produto alinhado inicialmente à **rede pública de saúde**.

## 6. Pontos de atenção para produção

- Protocolos clínicos devem ser validados pela equipe assistencial responsável antes de uso real.
- Alertas são apoio à decisão e não substituem avaliação profissional.
- Integrações públicas dependem das APIs, padrões e credenciais oficialmente disponibilizados.
- Arquivos clínicos devem permanecer em armazenamento privado e entrega autenticada.
- Pusher e demais integrações externas precisam de checklist de ambiente.
- Backup deve ser testado periodicamente com restauração real em ambiente controlado.
- Mudanças de schema Prisma devem sempre passar pelo pipeline de regressão.
- Não utilizar localStorage/sessionStorage para dados clínicos sensíveis.

## 7. Validação atual

A base do projeto possui:

- testes unitários;
- regressão automatizada;
- smoke test com PostgreSQL;
- TypeScript;
- build de produção;
- CI/CD;
- validações de RBAC;
- validações de segurança.

A próxima grande etapa não é “consertar o sistema”, mas **transformar as capacidades já existentes em fluxos operacionais completos para a rede pública**.

## 8. Ordem recomendada das próximas etapas

1. **NIR/regulação operacional completo.**
2. **Protocolos clínicos integrados à assistência.**
3. **Identificação segura do paciente por QR/Barcode.**
4. **Dashboards e indicadores da rede pública.**
5. **FHIR R4 operacional e auditado.**
6. **Hardening de produção e documentação de implantação.**
7. **Regressão completa e validação final.**

---

*Última atualização: 2026-10-07 — direcionamento ajustado para rede pública de saúde e retirada do faturamento do roadmap.*

## 9. Incidentes de produção e correções — 2026-10-08

Foi documentado um incidente de deploy em que o container do Coolify ficou `unhealthy` durante a inicialização.

### Causa identificada

- PostgreSQL de produção já existente sem histórico Prisma.
- `prisma migrate deploy` retornando P3005.
- Script de baseline usando a opção removida `--from-url` do Prisma 7.8.0.
- O diagnóstico de incompatibilidade do schema era inconclusivo porque o comando de diff falhava antes da comparação.

### Correção

- `scripts/deploy-migrations-safe.mjs` passou a utilizar `--from-config-datasource`.
- A validação estrutural antes do baseline foi preservada.
- O baseline continua bloqueado quando existe diferença real entre banco e schema.
- PR #28 foi validado pela CI e integrado à `main` em 2026-10-08.
- Commit de merge: `ffbea667b8e28c519ee21cab82cfe4329b1b6c3c`.
- Dockerfile já instala `curl` e `wget` e possui healthcheck para `/api/health`.

### Pendência de produção

O GitHub não possui acesso direto ao runtime do Coolify/PostgreSQL. É necessário executar novo deploy da `main`. Se o banco possuir diferença estrutural real, o novo log deverá mostrar a diferença sem aplicar baseline indevido.

Consulte o diagnóstico completo em [docs/incidentes-producao.md](docs/incidentes-producao.md).

---

*Última atualização: 2026-10-08 — registro de incidentes de produção, correção Prisma 7 e fluxo de baseline seguro.*
