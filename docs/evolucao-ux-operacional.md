# Evolução UX Operacional — SGH

## Objetivo

Esta evolução transforma o SGH de uma navegação orientada principalmente por módulos para uma experiência orientada por tarefas, sem substituir a arquitetura existente.

## Entregas

### Minha Fila
- Nova rota: \`/minha-fila\`.
- Reutiliza \`obterPendenciasUsuario\` e a mesma regra de prioridade da Central de Tarefas.
- Mostra total, críticas, altas e lista acionável.
- Cada tarefa abre diretamente o fluxo correspondente.
- Não cria uma segunda fonte de verdade para pendências.

### Resumo operacional
- O dashboard passa a apresentar a próxima ação recomendada antes dos gráficos.
- O usuário consegue abrir a fila completa em um clique.
- A experiência permanece compatível com os perfis RBAC já existentes.

### Busca global
- Disponível no cabeçalho em telas maiores.
- Atalho \`Ctrl+K\` (ou \`Cmd+K\` no macOS).
- Busca inicial por áreas e ações do SGH.
- Foi deliberadamente implementada sem novo pacote e sem duplicar APIs clínicas.
- A evolução futura pode conectar a busca a uma API de pacientes/prontuários após validação dos requisitos de autorização, criptografia e auditoria.

### Responsividade
- A fila usa layout fluido e prioriza conteúdo essencial em telas estreitas.
- A base visual deve evoluir para cards em tabelas densas, sem simplesmente reduzir a largura das colunas.

## Próximas etapas

1. Busca clínica real por paciente/prontuário, respeitando RBAC e auditoria.
2. Ação "Próximo paciente" por perfil.
3. Dashboard operacional específico por perfil.
4. Linha do tempo longitudinal do paciente.
5. Ações contextuais dentro do atendimento e internação.
6. Cards mobile para tabelas de alta densidade.
7. Autosave e indicadores de progresso em formulários clínicos.
8. Notificações acionáveis.
9. Mapa operacional de leitos.
10. Indicadores gerenciais e de gargalos.

## Segurança

Nenhuma regra de acesso foi relaxada nesta etapa. A nova página reutiliza a sessão autenticada e a função central de pendências. A busca inicial navega para áreas existentes e não expõe dados clínicos diretamente no componente cliente.

## Validação

A branch deve ser validada por:
- testes unitários;
- TypeScript;
- build Next.js;
- smoke RBAC;
- revisão visual desktop/mobile.

Nenhuma migration de banco é necessária para esta etapa.
