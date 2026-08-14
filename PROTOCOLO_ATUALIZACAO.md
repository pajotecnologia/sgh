# Protocolo de Atualização em Produção — SGH (sgh.pajotech.com.br)

Este documento descreve as diretrizes e os comandos padronizados para realizar atualizações rápidas, seguras e com **zero tempo de inatividade** no ambiente de produção do sistema **SGH (sgh.pajotech.com.br)**.

---

## 1. Diretrizes de Segurança para Atualizações

1. **Evitar Dependências Desnecessárias**:
   - Sempre prefira implementar componentes de interface com **React nativo + Tailwind CSS + Lucide Icons**.
   - Se precisar adicionar um novo pacote no `package.json`, certifique-se de testar o `npm install` antes do envio para evitar erros de compilação na VPS.

2. **Validação Local Obrigatória**:
   - NUNCA suba atualizações sem validar a compilação local: `npm run build`.
   - Se houver alterações no banco de dados, execute `npm run db:update:sql` para regenerar os arquivos `.sql` de apoio.

3. **Logomarcas e Arquivos de Mídia**:
   - A rota de uploads (`/api/uploads`) permite a leitura pública de imagens (`.png`, `.jpg`, `.webp`) para garantir que os relatórios e impressões médicas carreguem as logomarcas da instituição em produção.

---

## 2. Passo a Passo do Desenvolvimento (Local -> GitHub)

Quando terminar uma alteração no código local:

```bash
# 1. Atualiza os arquivos SQL de apoio na pasta database/
npm run db:update:sql

# 2. Testa a compilação local (deve finalizar com zero erros)
npm run build

# 3. Envia para o repositório remoto
git add .
git commit -m "feat: sua mensagem de alteracao"
git push origin main
```

---

## 3. Passo a Passo da Atualização em Produção (VPS / aaPanel)

Acesse a pasta do projeto na VPS (`/www/wwwroot/sgh.pajotech.com.br`) pelo terminal ou aaPanel e rode **este comando único**:

```bash
npm run deploy:prod
```

ou (em caso de sincronização forçada):

```bash
git fetch origin main && git reset --hard origin/main && npm run deploy:prod
```

---

## 4. O que o comando `npm run deploy:prod` faz sozinho:

| Etapa | Ação | Descrição |
|-------|------|-----------|
| **1/5** | `git pull origin main` | Baixa as alterações mais recentes do GitHub. |
| **2/5** | `npm install --registry=https://registry.npmjs.org/` | Instala/sincroniza pacotes usando o servidor oficial do NPM. |
| **3/5** | `npm run db:migrate:deploy` | Aplica as novas migrações do PostgreSQL sem perda de dados. |
| **4/5** | `npm run build:release` | Compila o Next.js e empacota a release de produção. |
| **5/5** | `pm2 reload sgh.pajotech.com.br` | Recarrega a instância do PM2 com **zero downtime**. |

---

## 5. Referência do Banco de Dados (pgAdmin4)

Caso deseje atualizar o banco manualmente pelo **pgAdmin4**:
- Execute o script [`database/sgh_update_schema.sql`](file:///c:/Users/AdminUser/Documentos/PROJETOS_SISTEMAS/sgh/database/sgh_update_schema.sql) na ferramenta de Query Tool (F5).
