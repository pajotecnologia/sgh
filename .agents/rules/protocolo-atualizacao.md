# Protocolo Rigoroso de Atualização em Produção — SGH (sgh.pajotech.com.br)

## 1. Princípios Fundamentais para Atualizações em Produção
- **Zero Break em Produção**: O SGH é um sistema hospitalar em uso contínuo por médicos, enfermeiros e recepção. Toda atualização deve ser precisa, direta e com zero tempo de inatividade indevido.
- **Componentes Nativos & Leves**: Não adicione bibliotecas externas pesadas ou não declaradas no `package.json`. Utilize componentes puros com React, Tailwind CSS e Lucide Icons para evitar falhas de `MODULE_NOT_FOUND` na compilação da VPS.
- **Validação Local Obrigatória**: NENHUM código deve ser commitado para a branch `main` sem passar por `npm run build` local zerado (sem erros de TypeScript) e atualização dos arquivos `.sql`.

## 2. Configurações Fixas da VPS (aaPanel / Linux)
- **Instância do PM2**: `sgh.pajotech.com.br` (Process ID no PM2: 10)
- **Diretório na VPS**: `/www/wwwroot/sgh.pajotech.com.br`
- **NPM Registry**: Sempre utilizar `https://registry.npmjs.org/` para prevenir erros `E403 Forbidden` de espelhos incorretos no aaPanel.
- **Leitura de Imagens/Logomarcas**: A rota `/api/uploads` deve permitir leitura pública de mídias estáticas (`.png`, `.jpg`, `.webp`) para que logomarcas e relatórios impressos carreguem sem falha de autenticação.

## 3. Checklist do Desenvolvedor Antes do Envio (Dev -> GitHub)
1. Executar `npm run db:update:sql` (atualiza os arquivos `sgh_update_schema.sql` e `sgh_banco_completo.sql` para o pgAdmin4).
2. Executar `npm run build` localmente para garantir 100% de compilação sem erro.
3. Commitar com mensagem clara (`feat:` ou `fix:`) e fazer o `git push origin main`.

## 4. Comando de Deploy em 1-Clique na VPS (GitHub -> Produção)
Na VPS (`/www/wwwroot/sgh.pajotech.com.br`), basta executar:

```bash
npm run deploy:prod
```

ou em caso de pendência local de Git na VPS:

```bash
git fetch origin main && git reset --hard origin/main && npm run deploy:prod
```

### Fluxo Automático Executado:
1. `git pull origin main` (Baixa código atualizado)
2. `npm install --registry=https://registry.npmjs.org/` (Sincroniza pacotes com registry oficial)
3. `npm run db:migrate:deploy` (Aplica migrações PostgreSQL com segurança)
4. `npm run build:release` (Compila Next.js e empacota a release)
5. `pm2 reload sgh.pajotech.com.br` (Recarrega o processo no PM2 com zero downtime)

## 5. Regra para migrations Prisma 7 em produção

Antes de qualquer atualização que altere schema, validar migrations no CI e no ambiente de produção.

Para PostgreSQL existente sem histórico Prisma, usar `scripts/deploy-migrations-safe.mjs`. O script utiliza `--from-config-datasource`; `--from-url` não é compatível com Prisma 7.8.0.

Nunca marcar todas as migrations como aplicadas para esconder uma diferença estrutural. Em caso de diff real, parar o deploy, fazer backup e corrigir o schema/migration de forma controlada.

Em caso de container `unhealthy`, diagnosticar primeiro entrypoint, migrations e inicialização do Next.js. O Dockerfile já fornece `curl` e `wget` para o healthcheck.

Consultar o registro em `docs/incidentes-producao.md`.

## 6. Diretrizes de Memória & Regras de Negócio Estabelecidas

1. **Versionamento Contínuo**:
   - Toda e qualquer alteração no código DEVE ser acompanhada pelo bump de versão executando:
     ```bash
     node scripts/atualizar-versao.mjs --bump
     ```
   - O versionamento atualiza automaticamente `package.json` e `lib/versao.ts`.

2. **Prevenção de Telas Estouradas (Layout & Responsividade)**:
   - Nenhuma tela deve apresentar estouro de layout (horizontal overflow).
   - Tabelas extensas devem estar contidas em `overflow-x-auto` dentro de containers com `w-full max-w-full`.
   - Textos longos devem utilizar `break-words` ou `truncate`.
   - Utilizar classes Tailwind responsivas (`flex-wrap`, `grid-cols-1 sm:grid-cols-2`, `min-w-0`).

3. **Prescrições Médicas e Farmácia**:
   - O médico pode prescrever **Medicamentos** e **Procedimentos & Cuidados de Enfermagem** (curativos, sondagens, punção, etc.).
   - Procedimentos podem vincular **Kits de Insumos/Materiais** cadastrados na farmácia.
   - Na tela de **Dispensação da Farmácia** (`/farmacia/dispensacao`), os materiais e kits dos procedimentos prescritos aparecem de forma clara e estruturada para separação e baixa.
   - Prescrições de uso imediato no PS bloqueiam a finalização do atendimento até a checagem da enfermagem e evolução pós-uso.

4. **Histórico Longitudinal do Paciente (PEP)**:
   - Visualização do prontuário histórico aberta em página dedicada, limpa e sem menus redundantes para máxima usabilidade médica.

5. **Obstetrícia & Berçário**:
   - Pacientes obstétricas (sexo biológico feminino) têm dados carregados em todas as fases (Triagem, Consultório PS e Internação).
   - A aba `INTERNACAO_OBSTETRICA` e o toggle obstétrico atualizam de forma reativa e instantânea.
   - Cuidados e aprazamentos de recém-nascidos são geridos na aba `MEDICACAO_BERCARIO`.

6. **Condições de Alta & Encerramento Hospitalar**:
   - A aba **Condições de alta** pertence exclusivamente ao menu de **Prontuário Médico** (`ABAS_PRONTUARIO`).
   - Apenas médicos (`MEDICO`), diretores clínicos (`DIRETOR_CLINICO`) e administradores (`ADMIN`) possuem autorização para registrar condições de alta e conceder alta hospitalar (ação RBAC `CONCEDER_ALTA`).
   - Perfis de enfermagem e recepção têm acesso de edição estritamente bloqueado.


