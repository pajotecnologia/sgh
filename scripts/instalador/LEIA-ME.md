# SGH — Instalação por cópia (VPS / aaPanel)

Copie **todo o conteúdo desta pasta** para o diretório do site, por exemplo:

```
/www/wwwroot/sgh.pajotech.com.br/
```

Não é necessário clonar o Git nem compilar no servidor.

---

## Estrutura (tudo na raiz do site)

| Ficheiro / pasta | Função |
|------------------|--------|
| **`index.html`** | Página de entrada — redireciona para `/login` |
| **`index.js`** | Arranque automático (PM2 / aaPanel Node) |
| **`server.js`** | Servidor Next.js compilado |
| **`.next/`**, **`node_modules/`**, **`public/`** | Aplicação |
| **`database/`** | SQL PostgreSQL |
| **`.env.example`** | Modelo — copie para `.env` |
| **`instalar.sh`** | Configura e **inicia o sistema sozinho** |
| **`nginx.example.conf`** | Proxy reverso Nginx |

---

## Passo 1 — Copiar ficheiros

Via FTP, aaPanel File Manager ou:

```bash
rsync -avz ./ usuario@vps:/www/wwwroot/sgh.pajotech.com.br/
```

---

## Passo 2 — Configurar banco (só editar `.env`)

```bash
cp .env.example .env
nano .env
```

Ajuste **apenas**:

```env
DATABASE_URL="postgresql://sgh_user:SUA_SENHA@127.0.0.1:5432/sgh_db"
NEXTAUTH_URL="https://sgh.pajotech.com.br"
```

Crie o banco no PostgreSQL (aaPanel → Database ou psql):

```sql
CREATE USER sgh_user WITH PASSWORD 'SUA_SENHA';
CREATE DATABASE sgh_db OWNER sgh_user;
```

---

## Passo 3 — Instalar e iniciar (uma vez)

```bash
cd /www/wwwroot/sgh.pajotech.com.br
chmod +x instalar.sh
./instalar.sh
```

O script:
- Gera chaves de segurança
- Importa o schema SQL (se o banco estiver vazio)
- **Inicia o SGH com PM2** (sem `node server.js` manual)

---

## aaPanel (sem terminal)

1. Copie os ficheiros para `/www/wwwroot/sgh.pajotech.com.br/`
2. Renomeie `.env.example` → `.env` e preencha `DATABASE_URL` e `NEXTAUTH_URL`
3. **Website → Node Project → Add**
   - Diretório: `/www/wwwroot/sgh.pajotech.com.br`
   - **Startup file: `index.js`**
   - Porta: **3002**
4. **Reverse proxy** do site → `http://127.0.0.1:3002` (ver `nginx.example.conf`)
5. Importe `database/sgh_schema_completo.sql` no PostgreSQL pelo painel

Aceda: **https://sgh.pajotech.com.br** → `index.html` redireciona para login.

---

## Primeiro acesso (se importou seed)

- **E-mail:** `admin@hospital.com`
- **Senha:** `Sgh@2024!`

---

## Banco de dados

- **SGBD:** PostgreSQL 16
- **Schema:** `database/sgh_schema_completo.sql`
- **Usuários demo (SQL):** `database/seed_usuarios_iniciais.sql`

### Popular com 25 pacientes + filas completas

Na máquina de desenvolvimento (projeto SGH), apontando para o banco da VPS:

```bash
DATABASE_URL="postgresql://user:senha@IP:5432/sgh_db" npm run db:seed
```

Use a mesma `ENCRYPTION_KEY` da VPS. Ver `database/LEIA-SEED.md`.

---

## Regenerar pacote (desenvolvimento)

```bash
npm run build:instalador
```

---

## Erro: **404 Not Found** (nginx)

Isto significa que o **Nginx procura ficheiros no disco** em vez de encaminhar para o **Node.js**.

O SGH **não** funciona só com `index.html` estático — rotas como `/login`, `/api/...` precisam do Node na porta **3002**.

### Corrigir (aaPanel)

1. **Iniciar o Node** (se ainda não corre):
   ```bash
   cd /www/wwwroot/sgh.pajotech.com.br
   ./instalar.sh
   ```
   Ou: PM2 Manager → projeto → path acima → startup **`index.js`** → porta **3002** → Start

2. **Reverse proxy** (obrigatório):
   - Website → **sgh.pajotech.com.br** → **Reverse proxy** → Create
   - Target: `http://127.0.0.1:3002`
   - Proxy path: `/` (todo o site)

3. **Testar no servidor**:
   ```bash
   ./verificar.sh
   curl -I http://127.0.0.1:3002/login
   ```
   Se local retorna **200/307** mas o domínio dá **404** → falta proxy nginx (ver `nginx-aapanel-CORRIGIR-404.conf`).

4. **Evitar** `try_files $uri $uri/ =404` no `location /` — remove e use só `proxy_pass`.

### Checklist rápido

| Verificação | Comando / ação |
|-------------|----------------|
| Ficheiros na raiz do site | `ls index.js server.js .next` |
| Node a correr | `pm2 list` ou `./verificar.sh` |
| Resposta local | `curl http://127.0.0.1:3002/login` |
| Proxy nginx | aaPanel → Reverse proxy → `:3002` |
| `.env` | `NEXTAUTH_URL=https://sgh.pajotech.com.br` |
