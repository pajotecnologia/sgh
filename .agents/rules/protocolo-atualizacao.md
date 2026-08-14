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
