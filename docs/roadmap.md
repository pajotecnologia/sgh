# SGH — Roadmap e Visão de Futuro

## 1. Evolução Consolidada

O SGH evoluiu de um MVP de consultório para um **Sistema de Gestão Hospitalar Unificado**, cobrindo todas as fases críticas do cuidado:

- **Segurança & Acesso**: MFA nativo (TOTP), gestão de sessões e revogação remota de dispositivos, rate limiting de credenciais e painel público, criptografia AES-256-GCM.
- **Ciclo Clínico**: Triagem de Manchester, Anamnese, Prescrição com verificação de interações, Aplicação com 5 Certos, Exames laboratoriais estruturados e laudos PDF.
- **Internamento**: Mapa visual interativo de leitos, transferências ágeis de leito, laudo AIH, SAE de enfermagem e evolução multidisciplinar.
- **Prontuário Longitudinal**: PEP com linha do tempo de eventos clínicos por paciente.
- **Gestão Operacional**: Central de tarefas e pendências por perfil, relatórios gerenciais e taxa de ocupação em tempo real.

---

## 2. Próximas Fases de Desenvolvimento

### Fase 5 — Interoperabilidade & Padrões em Saúde
- **FHIR R4**: Camada de tradução de recursos para `Patient`, `Encounter`, `Observation`, `Condition`, `MedicationRequest` e `DiagnosticReport`.
- **Barcoding / Código de Barras**: Leitura de pulseiras de identificação na beira do leito para administração segura.
- **Assinatura Digital ICP-Brasil**: Assinatura com certificado digital A1/A3 nos laudos e prescrições médicas.

### Fase 6 — Automação e Qualidade
- **Alertas Clínicos em Tempo Real**: Notificações instantâneas de exames críticos e deterioração de sinais vitais via Pusher.
- **PWA Avançado**: Suporte aprimorado para tablets de triagem e enfermagem.
