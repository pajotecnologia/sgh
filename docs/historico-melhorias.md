# SGH — Histórico Completo de Melhorias e Orientações de Engenharia

Este documento consolida o registro histórico detalhado de todas as implementações, refatorações, decisões arquiteturais e normas clínicas aplicadas ao **SGH (Sistema de Gestão Hospitalar)** para servir de guia e orientação permanente a desenvolvedores, auditores e equipe de operações.

---

## 📑 Índice de Módulos e Entregas

1. [Arquitetura & Ciclo Integrado de Cuidado](#1-arquitetura--ciclo-integrado-de-cuidado)
2. [Interface de Login & Branding PAJO Tecnologia](#2-interface-de-login--branding-pajo-tecnologia)
3. [Mapa Visual de Leitos & Gestão de Ocupação](#3-mapa-visual-de-leitos--gestão-de-ocupação)
4. [Central de Tarefas & Pendências Clínicas por Perfil](#4-central-de-tarefas--pendências-clínicas-por-perfil)
5. [Exames Laboratoriais Estruturados & Valores de Referência](#5-exames-laboratoriais-estruturados--valores-de-referência)
6. [Prontuário Eletrônico do Paciente (PEP Longitudinal)](#6-prontuário-eletrônico-do-paciente-pep-longitudinal)
7. [Fase 1: Assinatura Digital ICP-Brasil & Termos Eletrônicos (TCLE)](#7-fase-1-assinatura-digital-icp-brasil--termos-eletrônicos-tcle)
8. [Fase 2: Protocolos Clínicos Gerenciados & Segurança do Paciente](#8-fase-2-protocolos-clínicos-gerenciados--segurança-do-paciente)
9. [Fase 3: Operação Hospitalar Avançada (NIR, Bloco Cirúrgico OMS, Óbito)](#9-fase-3-operação-hospitalar-avançada-nir-bloco-cirúrgico-oms-óbito)
10. [Fase 4: Faturamento SUS (BPA/AIH), Padrão ANS TISS/TUSS & Acreditação ONA](#10-fase-4-faturamento-sus-bpaaih-padrão-ans-tisstuss--acreditação-ona)
11. [Fase 5: Interoperabilidade HL7 FHIR R4](#11-fase-5-interoperabilidade-hl7-fhir-r4)
12. [Segurança, Criptografia, MFA & Gestão de Sessões](#12-segurança-criptografia-mfa--gestão-de-sessões)
13. [Governança Documental & Suíte de Testes Automatizados](#13-governança-documental--suíte-de-testes-automatizados)

---

## 1. Arquitetura & Ciclo Integrado de Cuidado

### Mudança Conceitual Central:
O sistema evoluiu do modelo de telas estanques para um **fluxo operacional contínuo centrado no paciente**:

$$\text{Paciente} \to \text{Recepção} \to \text{Triagem Manchester} \to \text{Mesa Médica} \to \text{Prescrição/Exames} \to \text{Farmácia FEFO} \to \text{Enfermagem 5 Certos} \to \text{Mapa de Leitos} \to \text{Evoluções} \to \text{Alta} \to \text{PEP Longitudinal}$$

- **Stack:** Next.js 16 (App Router), React 19, Tailwind CSS, Prisma 7 com driver PostgreSQL nativo `pg`, NextAuth com sessões persistidas em banco e Pusher para WebSockets.
- **Porta Oficial de Execução:** `3002` (conforme `.env` e `package.json`).

---

## 2. Interface de Login & Branding PAJO Tecnologia

- **Arquivos:** [`app/(auth)/login/page.tsx`](file:///app/%28auth%29/login/page.tsx), [`components/auth/FormularioLogin.tsx`](file:///components/auth/FormularioLogin.tsx), [`components/shared/LogoPajo.tsx`](file:///components/shared/LogoPajo.tsx).
- **Design:** Split view moderno em 12 colunas com gradiente escuro profundo, microbrilhos sutis, cards de vidro (*glassmorphism*) e formulário minimalista.
- **Logomarca:** Vetor SVG fiel da **PAJO Tecnologia** posicionado no rodapé da tela, alinhado à esquerda com opacidade elegante (`opacity-75 hover:opacity-100`).
- **Controle de Versão:** Pílula no canto superior direito (`🟢 v2.5.0 • build 26.09`) e indicação de versão no rodapé.
- **Acesso Rápido de Demonstração:** Pílulas clicáveis para preenchimento ágil de perfis (*Administrador*, *Médico*, *Enfermeiro*, *Farmácia*, *Recepção*).

---

## 3. Mapa Visual de Leitos & Gestão de Ocupação

- **Arquivos:** [`lib/mapa-leitos.ts`](file:///lib/mapa-leitos.ts), [`app/api/internamento/mapa-leitos/route.ts`](file:///app/api/internamento/mapa-leitos/route.ts), [`app/api/internamento/mapa-leitos/transferencia/route.ts`](file:///app/api/internamento/mapa-leitos/transferencia/route.ts), [`app/api/internamento/mapa-leitos/status/route.ts`](file:///app/api/internamento/mapa-leitos/status/route.ts), [`components/internamento/MapaLeitosVisual.tsx`](file:///components/internamento/MapaLeitosVisual.tsx), [`app/(dashboard)/internamento/mapa-leitos/page.tsx`](file:///app/%28dashboard%29/internamento/mapa-leitos/page.tsx).
- **Recursos:**
  - Grid hospitalar agrupado por Clínica e Ala.
  - Indicador visual por cor de estado: **Verde** (Disponível), **Azul** (Ocupado), **Âmbar** (Interditado/Higienização).
  - Cards com dados do paciente internado, badge Manchester, tempo de permanência formatado (ex.: `1d 5h`), hipótese diagnóstica CID-10 e médico assistente.
  - Modais de ação: Transferência atômica com trava contra concorrência, Bloqueio/Interdição com registro de motivo e atalhos diretos para Prontuário e Ficha de Internação.
  - Métricas em tempo real: Taxa de Ocupação (%), contadores de UTI, Isolamento e Enfermarias.

---

## 4. Central de Tarefas & Pendências Clínicas por Perfil

- **Arquivos:** [`lib/central-tarefas.ts`](file:///lib/central-tarefas.ts), [`app/api/dashboard/pendencias/route.ts`](file:///app/api/dashboard/pendencias/route.ts), [`components/dashboard/CentralTarefasPendencias.tsx`](file:///components/dashboard/CentralTarefasPendencias.tsx), [`app/(dashboard)/dashboard/page.tsx`](file:///app/%28dashboard%29/dashboard/page.tsx).
- **Recursos:**
  - Painel de ação rápida no topo do dashboard calculando filas em tempo real.
  - **Médicos:** Fila de espera com classificação Manchester, tempo de espera e exames recém-liberados.
  - **Enfermagem:** Aplicações de medicação pendentes com tempo decorrido, pacientes aguardando triagem e solicitações de admissão hospitalar.
  - **Farmácia:** Prescrições hospitalares aguardando triagem farmacêutica.

---

## 5. Exames Laboratoriais Estruturados & Valores de Referência

- **Arquivos:** [`lib/exames-estruturados.ts`](file:///lib/exames-estruturados.ts), [`components/atendimento/VisualizadorResultadoExame.tsx`](file:///components/atendimento/VisualizadorResultadoExame.tsx), [`app/api/atendimento/[atendimentoId]/exames/item/[itemId]/route.ts`](file:///app/api/atendimento/%5BatendimentoId%5D/exames/item/%5BitemId%5D/route.ts).
- **Recursos:**
  - Parser e serializador estruturado com suporte a múltiplos parâmetros, valores quantitativos e unidades.
  - Avaliação automática de faixa de referência: `NORMAL` (verde), `ABAIXO` (âmbar), `ACIMA` (âmbar) e `CRITICO ⚠️` (vermelho com destaque).
  - Renderização transparente em tabelas nos atendimentos médicos e no Prontuário Longitudinal com link seguro para laudos em PDF.

---

## 6. Prontuário Eletrônico do Paciente (PEP Longitudinal)

- **Arquivos:** [`lib/historico-paciente.ts`](file:///lib/historico-paciente.ts), [`app/api/pacientes/[id]/historico-longitudinal/route.ts`](file:///app/api/pacientes/%5Bid%5D/historico-longitudinal/route.ts), [`components/prontuario/TimelineHistoricoPaciente.tsx`](file:///components/prontuario/TimelineHistoricoPaciente.tsx), [`app/(dashboard)/prontuario/paciente/[id]/page.tsx`](file:///app/%28dashboard%29/prontuario/paciente/%5Bid%5D/page.tsx).
- **Recursos:**
  - Linha do tempo unificada de episódios clínicos: triagens, sinais vitais, hipóteses diagnósticas CID-10, prescrições, exames laboratoriais e evoluções.
  - Painel superior com dados cadastrais, alergias ativas e medicamentos de uso contínuo.

---

## 7. Fase 1: Assinatura Digital ICP-Brasil & Termos Eletrônicos (TCLE)

- **Arquivos:** [`lib/assinatura-digital.ts`](file:///lib/assinatura-digital.ts), [`lib/termos-eletronicos.ts`](file:///lib/termos-eletronicos.ts), [`app/api/termos/route.ts`](file:///app/api/termos/route.ts).
- **Recursos:**
  - Geração de hash SHA-256 e código de validação pública no formato `ABCD-1234-EFGH-5678`.
  - Estruturação de metadados PAdES para certificados digitais A1/A3 e nuvem (Resolução CFM nº 2.299/2021).
  - Termos padronizados com suporte a assinatura em tela/touch: TCLE de Procedimento, Hemoterapia, Internação, Recusa de Tratamento, Evasão e Consentimento LGPD.

---

## 8. Fase 2: Protocolos Clínicos Gerenciados & Segurança do Paciente

- **Arquivos:** [`lib/protocolos-clinicos.ts`](file:///lib/protocolos-clinicos.ts), [`lib/escalas-risco.ts`](file:///lib/escalas-risco.ts).
- **Recursos:**
  - **Protocolo de Sepse:** Detecção automática via qSOFA (FR $\ge 22$, PAS $\le 100$, Glasgow $< 15$) e critérios SIRS com alerta crítico da "Golden Hour".
  - **Protocolo de AVC:** Escala de Cincinnati e cronômetro de janela trombolítica ($\le 4.5\text{h}$).
  - **Protocolo de Dor Torácica / IAM:** Alerta de dor precordial típica com tempo porta-ECG ($\le 10\text{ min}$).
  - **Escala de Braden:** Risco de Lesão por Pressão (LPP) com condutas automáticas de enfermagem.
  - **Escala de Morse:** Risco de Queda do leito e recomendações de barreira.
  - **SBAR:** Passagem de plantão padronizada (*Situation, Background, Assessment, Recommendation*).
  - **Pulseira do Paciente:** Identificação com Código de Barras e QR Code para beira do leito.

---

## 9. Fase 3: Operação Hospitalar Avançada (NIR, Bloco Cirúrgico OMS, Óbito)

- **Arquivos:** [`lib/nir-regulacao.ts`](file:///lib/nir-regulacao.ts), [`lib/bloco-cirurgico.ts`](file:///lib/bloco-cirurgico.ts), [`lib/protocolo-obito.ts`](file:///lib/protocolo-obito.ts).
- **Recursos:**
  - **NIR (Núcleo Interno de Regulação):** Gestão de vagas externas (CROSS, SUSfácil, CER) e alerta de leito retido ($> 24\text{h}$).
  - **Bloco Cirúrgico OMS:** Checklist de Cirurgia Segura com etapas **Sign In**, **Time Out** e **Sign Out**.
  - **Protocolo de Óbito:** Registro de causas direta/básica, número oficial da Declaração de Óbito (DO) e destinação do corpo.

---

## 10. Fase 4: Faturamento SUS (BPA/AIH), Padrão ANS TISS/TUSS & Acreditação ONA

- **Arquivos:** [`lib/faturamento-hospitalar.ts`](file:///lib/faturamento-hospitalar.ts), [`lib/indicadores-acreditacao.ts`](file:///lib/indicadores-acreditacao.ts).
- **Recursos:**
  - **Faturamento SUS:** Espelho de AIH (diárias de UTI e clínica) e BPA.
  - **Saúde Suplementar:** Geração de XML no padrão ANS TISS com procedimentos mapeados na tabela TUSS.
  - **Indicadores de Qualidade ONA/JCI:** Média de Permanência (MP), Densidade de Infecção Hospitalar (IRAS/CCIH) por 1.000 pacientes-dia, Giro de Leito e Taxa de Mortalidade Institucional.

---

## 11. Fase 5: Interoperabilidade HL7 FHIR R4

- **Arquivos:** [`lib/fhir-r4.ts`](file:///lib/fhir-r4.ts).
- **Recursos:**
  - Tradutores bidirecionais para os recursos HL7 FHIR R4 oficiais: `Patient`, `Observation` (sinais vitais mapeados em códigos internacionais LOINC e unidades UCUM) e `Encounter`.

---

## 12. Segurança, Criptografia, MFA & Gestão de Sessões

- **Criptografia em Repouso:** AES-256-GCM para dados sensíveis (`cpfCriptografado`, `nomeCriptografado`, etc.) e hash HMAC SHA-256 para indexação rápida.
- **MFA / TOTP:** Implementação nativa RFC 6238 com segredo criptografado e validação no login.
- **Gestão de Sessões (`/seguranca/sessoes`):** Sessões persistidas em `SessaoUsuario` com SHA-256, permitindo auditoria de dispositivos e encerramento remoto.
- **Rate Limiting:** Proteção contra força bruta em rotas de autenticação e painel público.
- **Hardening de Uploads:** Acesso autenticado e verificação de autorização em `/api/uploads/exames/*`.

---

## 13. Governança Documental & Suíte de Testes Automatizados

- **Manuais em `/docs`:**
  - [`docs/architecture.md`](file:///docs/architecture.md) — Arquitetura global e ciclo clínico.
  - [`docs/security.md`](file:///docs/security.md) — Segurança, criptografia, MFA e LGPD.
  - [`docs/database.md`](file:///docs/database.md) — Dicionário de modelos e schema Prisma.
  - [`docs/backup-restore.md`](file:///docs/backup-restore.md) — Procedimentos de backup e disaster recovery.
  - [`docs/roadmap.md`](file:///docs/roadmap.md) — Visão de evolução e histórico.
- **Testes Automatizados:** 44 arquivos de teste / **252 testes unitários passando com 100% de sucesso** via Vitest (`npm run test:run`).
