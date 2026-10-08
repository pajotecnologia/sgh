# Registro de Incidentes e Correções de Produção — SGH

Data de atualização: 2026-10-08
Repositório: pajotecnologia/sgh
Branch de referência: main

## 1. Objetivo

Registrar os problemas encontrados nos deploys do SGH, as causas técnicas identificadas, as correções realizadas e o que ainda depende da validação do ambiente de produção.

## 2. Incidente: container unhealthy

Sintoma observado no Coolify: Healthcheck status unhealthy, return code 1, novo container considerado unhealthy e rollback para o container anterior.

Causa raiz: o docker-entrypoint.sh executa scripts/deploy-migrations-safe.mjs antes de iniciar o Next.js. O prisma migrate deploy encontrou P3005 porque o PostgreSQL existente possui schema, mas não possui histórico correspondente na tabela _prisma_migrations.

O script então tentava comparar banco e schema utilizando --from-url. Essa opção foi removida pelo Prisma 7.8.0. Portanto, a mensagem anterior dizendo que o banco não correspondia ao schema não era um diagnóstico confiável: a comparação havia falhado antes de realmente comparar as estruturas.

## 3. Correção do Prisma 7

O arquivo scripts/deploy-migrations-safe.mjs foi corrigido.

Antes: prisma migrate diff com --from-url DATABASE_URL.

Depois: prisma migrate diff com --from-config-datasource e --to-schema prisma/schema.prisma.

A nova forma utiliza o datasource definido pelo prisma.config.ts.

A proteção contra schema drift foi mantida. O fluxo somente executa baseline quando o diff confirmar compatibilidade. Se houver diferença estrutural real, o deploy é interrompido sem marcar migrations como aplicadas.

Fluxo esperado: migrate deploy → P3005 → migrate diff → compatibilidade → baseline → migrate deploy → iniciar aplicação.

## 4. PR #28

PR: fix: corrigir baseline de migrations no Prisma 7.
Branch: fix/corrigir-baseline-prisma7.
CI do PR: sucesso.
Merge realizado em 2026-10-08.
Commit de merge: ffbea667b8e28c519ee21cab82cfe4329b1b6c3c.

A main já contém a correção.

## 5. Healthcheck Docker/Coolify

O Dockerfile atual instala curl e wget. Também possui HEALTHCHECK para http://127.0.0.1:3002/api/health, com start-period de 45 segundos.

Assim, o aviso do Coolify sobre curl/wget não era a causa raiz do incidente observado. O processo era encerrado durante a etapa de migration antes de iniciar normalmente o Next.js.

## 6. O que ainda precisa ser validado

O GitHub não possui acesso ao runtime do Coolify nem pode validar diretamente o PostgreSQL de produção. É necessário fazer novo deploy da main.

Se o banco for compatível, o baseline deverá ser realizado e o servidor deverá iniciar.

Se existir diferença real entre banco e schema, o novo log deverá mostrar essa diferença. Não deve ser feito baseline forçado para esconder o drift.

Depois da inicialização, o endpoint /api/health deve responder normalmente e o container deve ficar healthy.

## 7. Histórico de correções recentes

### Build e sessão

Foi corrigido o erro TypeScript em app/api/configuracoes/permissoes/route.ts relacionado à propriedade usuario da sessão. A sessão passou a ter tipagem explícita e foram ajustados testes e permissões padrão da triagem.

### RBAC parametrizado

Foram corrigidas validações de sessão incompleta, APIs de permissões, APIs de usuários, página de configurações e tratamento de erro do dashboard. O entrypoint passou a falhar de forma explícita quando migration obrigatória falha.

### Mapa de Leitos e Admissões

Foram corrigidas validações de sessão, guards, APIs e permissões padrão para MEDICO e DIRETOR_CLINICO, além do tratamento explícito de 401 e 403.

### Alta hospitalar

Foi separado o status da ficha do status efetivo da alta hospitalar. Foi criado StatusAltaHospitalar com RASCUNHO, EM_ANDAMENTO e CONCLUIDA. A alta concluída deve retirar o atendimento das listas de pacientes ativos e encaminhá-lo ao histórico.

### Triagem

A queixa principal foi separada da caracterização clínica da dor. EVA permanece como avaliação objetiva da intensidade. O antigo bloco Detalhes da dor foi reorganizado como Caracterização da dor.

## 8. Regra de diagnóstico de futuros unhealthy

1. Verificar logs do entrypoint.
2. Confirmar se o Next.js chegou a iniciar.
3. Verificar migrations Prisma.
4. Verificar variáveis de ambiente.
5. Verificar /api/health.
6. Confirmar curl/wget no container.
7. Somente depois avaliar a configuração do healthcheck do Coolify.

## 9. Segurança

Não registrar credenciais reais, URLs completas de banco, tokens ou chaves neste documento. Logs de produção podem conter informações sensíveis. Caso uma credencial real seja exposta em log público, ela deve ser considerada comprometida e rotacionada.

## 10. Estado em 2026-10-08

| Item | Estado |
|---|---|
| Correção Prisma 7 --from-url | Concluída |
| PR #28 | Mergeado |
| CI do PR #28 | Sucesso |
| curl no Dockerfile | Presente |
| wget no Dockerfile | Presente |
| Healthcheck | Configurado |
| Baseline protegido contra schema drift | Sim |
| Banco de produção validado pelo GitHub | Não |
| Novo deploy no Coolify após a correção | Necessário |
| Healthcheck real após novo deploy | Necessário |

Conclusão: o problema conhecido no código foi corrigido. A próxima evidência necessária é o log do novo deploy. Se continuar falhando, o próximo erro deverá ser tratado pela causa real, sem baseline forçado.