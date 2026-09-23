# SGH — Diretrizes e Arquitetura de Segurança

Este documento descreve os mecanismos de proteção de dados, autenticação, controle de acesso e conformidade LGPD implementados no **SGH**.

---

## 1. Criptografia de Dados em Repouso

Para proteção contra vazamentos em caso de acesso não autorizado à base de dados relacional, dados pessoais sensíveis são criptografados com **AES-256-GCM**:

- **Campos Criptografados**: `cpfCriptografado`, `nomeCriptografado`, `rgCriptografado`, `telefoneCriptografado`.
- **Chave de Criptografia**: Chave de 256 bits derivada de variável de ambiente segura (`ENCRYPTION_KEY` / `NEXTAUTH_SECRET`).
- **Busca Cega Segura**: Indexação e pesquisas rápidas por CPF são feitas por meio do campo `cpfHash` (HMAC SHA-256 irreversível).
- **Vetores de Inicialização (IV)**: Cada operação de criptografia gera um IV criptograficamente aleatório de 12 bytes concatenado ao ciphertext e auth tag.

---

## 2. Autenticação e MFA (Multi-Factor Authentication)

### 2.1 Senhas
- Senhas de usuários são cifradas com `bcrypt` (fator de custo 12) antes de qualquer persistência.

### 2.2 TOTP (Time-based One-Time Password)
- Implementação nativa compatível com a **RFC 6238** (Google Authenticator, Microsoft Authenticator, 1Password).
- O segredo TOTP gerado é armazenado criptografado no banco (`mfaSecret`).
- A ativação do MFA exige confirmação prévia com um código válido no primeiro uso.
- Tentativas de autenticação e códigos inválidos disparam eventos em `EventoMfa`.

---

## 3. Gestão de Sessões e Dispositivos

- As sessões de usuário são gerenciadas pelo modelo persistido `SessaoUsuario`.
- O token de sessão é armazenado no banco apenas na forma de hash **SHA-256**.
- A cada requisição autenticada, o servidor valida se a sessão não está expirada nem revogada.
- **Revogação Remota**: Usuários e administradores podem visualizar os dispositivos conectados (IP, navegador, sistema operacional, último acesso) e revogar acessos individuais ou encerrar todas as outras sessões em `/seguranca/sessoes`.

---

## 4. Rate Limiting e Proteção Contra Força Bruta

O SGH implementa rate limiting em memória e em middleware para proteção de endpoints sensíveis:
- **Autenticação (`/api/auth/*`)**: Limite de 8 tentativas consecutivas por par IP / e-mail em uma janela de 15 minutos.
- **Tentativas de Login**: Registro detalhado em `TentativaLogin` (sucesso, falha, motivo, IP e user-agent) para investigação de incidentes.
- **Painel Público (`/api/painel/config`)**: Limite de requisições por minuto com cache de configuração.

---

## 5. Armazenamento e Acesso a Arquivos Médicos

- Arquivos de laudos e exames (`/api/uploads/exames/*`) são armazenados em diretórios privados.
- O acesso a qualquer arquivo exige **autenticação prévia e verificação de autorização** no recurso (vínculo do arquivo ao atendimento e papel do usuário).
- Todo download ou visualização de exame gera registro na tabela `LogAcessoPaciente` em conformidade com a LGPD.

---

## 6. Trilha de Auditoria e Conformidade LGPD

- **`LogAuditoria`**: Tabela append-only imutável (sem `UPDATE` ou `DELETE`) que grava todas as alterações em registros clínicos, usuários, leitos e prescrições.
- **`LogAcessoPaciente`**: Registra leituras e consultas a dados de pacientes com justificativa/módulo.
- **`SolicitacaoTitular`**: Módulo dedicado para registro, gestão e cumprimento de direitos dos titulares de dados (acesso, correção, portabilidade, anonimização).
- **Exportação Compliance**: Suporte a exportação CSV de logs para relatórios de auditoria e conformidade hospitalar.
