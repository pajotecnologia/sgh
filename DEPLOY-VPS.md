# Instalação do SGH em servidor VPS (produção)

Este guia descreve o que precisa na máquina, como preparar o banco PostgreSQL, como gerar o pacote da aplicação e como expor o serviço com HTTPS.

## Visão geral da stack

| Componente | Versão sugerida | Notas |
|------------|-----------------|--------|
| Sistema operacional | Ubuntu Server 22.04 LTS ou 24.04 LTS | Outras distros funcionam com os mesmos conceitos |
| Node.js | 20 LTS ou 22 LTS | Alinhado a Next.js 16 |
| PostgreSQL | 16 (ou compatível) | O `docker-compose.yml` local usa `postgres:16-alpine` |
| Proxy reverso | Nginx ou Caddy | Termina TLS e encaminha para a app Node |

Recursos externos obrigatórios para funcionalidade completa:

- **Pusher** (painel de chamadas e triagem em tempo real): conta em [https://pusher.com](https://pusher.com).
- **Chaves fortes** para `NEXTAUTH_SECRET` e `ENCRYPTION_KEY` (ver `.env.example`).

---

## 1. Servidor: pacotes base

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw
```

Instale Node.js (exemplo com NodeSource, ajuste a versão LTS desejada):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
```

Instale PostgreSQL (exemplo Ubuntu):

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

---

## 2. Base de dados PostgreSQL

### Opção A — Referência DDL (ficheiro SQL no repositório)

O ficheiro `database/sgh_schema_completo.sql` contém o **schema completo** (enums, tabelas, índices, FKs) gerado a partir de `prisma/schema.prisma`. Serve para criar uma base **vazia** num servidor novo.

```bash
sudo -u postgres psql -c "CREATE DATABASE sgh_db OWNER sgh_user;"
sudo -u postgres psql -d sgh_db -f /caminho/para/sgh/database/sgh_schema_completo.sql
```

**Importante:** este script não cria a tabela `_prisma_migrations`. Se for manter o projeto com Prisma Migrate no servidor, prefira a **opção B** após clonar o código.

Para **regenerar** o SQL a partir do schema atual:

```bash
npm run db:schema:sql
```

### Opção B — Migrações Prisma (recomendado com o repositório Git)

Com o código completo no VPS e `DATABASE_URL` no `.env`:

```bash
cd /opt/sgh
npm ci
npm run db:migrate:deploy
npm run db:seed   # opcional: utilizadores de demonstração; troque senhas em produção
```

A variável `DATABASE_URL` deve apontar para o Postgres da VPS, por exemplo:

`postgresql://sgh_user:SENHA_FORTE@127.0.0.1:5432/sgh_db`

### Backup e exportação

```bash
pg_dump -h 127.0.0.1 -U sgh_user -d sgh_db -F p -f sgh_backup.sql
```

---

## 3. Variáveis de ambiente (produção)

Copie o modelo e edite valores reais (nunca commite `.env` com segredos):

```bash
cp .env.example .env
nano .env
```

Campos críticos:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL do PostgreSQL na VPS ou serviço gerido |
| `NEXTAUTH_URL` | URL pública do site, ex.: `https://sgh.seudominio.gov.br` |
| `NEXTAUTH_SECRET` | Gere com `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | 64 caracteres hex: `openssl rand -hex 32` |
| `PUSHER_*` e `NEXT_PUBLIC_PUSHER_*` | Credenciais da app Pusher |
| `NODE_ENV` | `production` |
| `UPLOAD_DIR` | Caminho absoluto recomendado, ex.: `/var/lib/sgh/uploads` |

Crie o diretório de uploads e dê permissão ao utilizador que corre a app:

```bash
sudo mkdir -p /var/lib/sgh/uploads
sudo chown -R deploy:deploy /var/lib/sgh/uploads
```

---

## 4. Build e pasta de deploy (`release/app`)

No **ambiente de build** (pode ser a própria VPS ou uma máquina de CI com Node):

```bash
git clone <url-do-repositorio> sgh && cd sgh
npm ci
cp .env.example .env   # preencher para o build ler variáveis se necessário
npm run build:release
```

O comando `build:release` faz:

1. `next build` com `output: "standalone"` em `next.config.js`.
2. Cópia do servidor mínimo para **`release/app`**, incluindo `.next/static` e `public`.

Para **só** empacotar depois de um `npm run build` já feito:

```bash
node scripts/package-release.mjs
```

Transfira a pasta `release/app` para a VPS (ex.: `rsync -avz release/app/ user@vps:/opt/sgh-app/`) e copie o `.env` de produção para junto de `server.js` (mesmo directório que o Node usa como cwd).

---

## 5. Arranque da aplicação

Na pasta onde está `server.js` (conteúdo de `release/app`):

```bash
export NODE_ENV=production
node server.js
```

Por defeito o Next escuta na porta **3002**. Em produção use **systemd** ou **PM2** e coloque Nginx à frente.

### Exemplo de unidade systemd (`/etc/systemd/system/sgh.service`)

Ajuste `User`, `WorkingDirectory` e o caminho do `.env`.

```ini
[Unit]
Description=SGH Next.js
After=network.target postgresql.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/sgh-app
EnvironmentFile=/opt/sgh-app/.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sgh
sudo systemctl status sgh
```

---

## 6. Nginx (proxy reverso + TLS)

Exemplo de bloco `server` (substitua o domínio e caminhos dos certificados; use **Let's Encrypt** com `certbot`):

```nginx
server {
    listen 443 ssl http2;
    server_name sgh.seudominio.gov.br;

    ssl_certificate     /etc/letsencrypt/live/sgh.seudominio.gov.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sgh.seudominio.gov.br/privkey.pem;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 7. Pós-instalação e segurança

- Altere todas as senhas dos utilizadores criados pelo `db:seed` se o tiver executado.
- Garanta backups periódicos do PostgreSQL e do directório de `UPLOAD_DIR`.
- Mantenha o SO e o Node atualizados; reexecute `npm run build:release` após `git pull` quando houver alterações de código.

---

## 8. Atualização Automatizada em Produção (`sgh.pajotech.com.br`)

Para realizar a atualização em produção de forma 100% automatizada e sem intervenção manual em cada etapa:

No servidor de produção (`sgh.pajotech.com.br`), navegue até o diretório do projeto e execute:

```bash
# Opção 1: Via atalho do npm
npm run deploy:prod

# Opção 2: Direto via script shell
./scripts/deploy-producao.sh
```

Este comando realiza automaticamente:
1. `git pull origin main` (baixa as últimas alterações do GitHub)
2. `npm ci` (sincroniza as dependências exatas do pacote)
3. `npm run db:migrate:deploy` (aplica todas as novas migrações do PostgreSQL)
4. `npm run build:release` (compila o Next.js e empacota o release)
5. `pm2 reload sgh.pajotech.com.br` (recarrega o processo PM2 com zero downtime)

---

## Referência rápida de comandos

| Objetivo | Comando |
|----------|---------|
| **Atualizar Produção (Automático)** | `npm run deploy:prod` ou `./scripts/deploy-producao.sh` |
| Build + pasta `release/app` | `npm run build:release` |
| Só build Next | `npm run build` |
| Regenerar SQL do schema | `npm run db:schema:sql` |
| Aplicar migrações (servidor com repo) | `npm run db:migrate:deploy` |
| Dados iniciais / utilizadores demo | `npm run db:seed` |
| Status do PM2 em Produção | `pm2 status sgh.pajotech.com.br` |
| Arranque manual em produção | `NODE_ENV=production node server.js` (na pasta `release/app`) |

Ficheiros úteis neste repositório: `scripts/deploy-producao.sh` (Script de Deploy Automatizado), `docker-compose.yml` (Postgres local), `.env.example` (variáveis), `database/sgh_schema_completo.sql` (DDL), `README.md` (desenvolvimento).

