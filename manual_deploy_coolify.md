# Manual de Deploy — Next.js + Coolify + PostgreSQL

> Guia passo a passo para instalar projetos Next.js em produção usando Coolify na VPS `169.58.246.70`.  
> Baseado nas lições do deploy do projeto **SGH** em 27/08/2026.

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Preparar o Projeto (Código)](#2-preparar-o-projeto-código)
3. [Criar o Banco PostgreSQL no Coolify](#3-criar-o-banco-postgresql-no-coolify)
4. [Popular o Banco de Dados](#4-popular-o-banco-de-dados)
5. [Criar a Aplicação no Coolify](#5-criar-a-aplicação-no-coolify)
6. [Configurar Variáveis de Ambiente](#6-configurar-variáveis-de-ambiente)
7. [Deploy](#7-deploy)
8. [Configurar SSL/HTTPS](#8-configurar-sslhttps)
9. [Checklist de Verificação](#9-checklist-de-verificação)
10. [Troubleshooting — Erros Comuns](#10-troubleshooting--erros-comuns)

---

## 1. Pré-requisitos

- [x] VPS com Coolify instalado (IP: `169.58.246.70`)
- [x] Código do projeto em repositório Git (GitHub/GitLab)
- [x] Domínio apontando para o IP da VPS (registro DNS tipo A)
- [x] pgAdmin configurado no Coolify (já existente)

---

## 2. Preparar o Projeto (Código)

Antes de enviar ao Coolify, o projeto precisa de **5 arquivos essenciais** na raiz:

### 2.1. `Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat curl wget

# Ignora ARGs que o Coolify injeta automaticamente
ARG NEXTAUTH_SECRET
ARG ENCRYPTION_KEY
ARG PUSHER_KEY
ARG PUSHER_SECRET

# 1. Copia pacotes e instala dependências
COPY package*.json .npmrc* ./
ENV NODE_ENV=development
RUN npm install --legacy-peer-deps

# 2. Prisma (se usar)
COPY prisma ./prisma
RUN npx prisma generate

# 3. Copia o código
COPY . .

# 4. Build Next.js
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Fallbacks para variáveis exigidas em tempo de build
ENV NEXTAUTH_SECRET="build-fallback-secret-min-32-chars-placeholder!!"
ENV ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
RUN npm run build

# Se tiver script de release (standalone), descomente:
# RUN node scripts/package-release.mjs

# Entrypoint (se tiver migrations automáticas)
RUN chmod +x docker-entrypoint.sh

# 5. Configurações de produção
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

EXPOSE 3002

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
```

> [!IMPORTANT]
> - A porta `3002` pode ser alterada para cada projeto (ex: 3003, 3004, 3005).
> - O `NODE_ENV=development` durante `npm install` garante que **devDependencies** (webpack, typescript, tailwindcss) sejam instaladas.
> - O `NODE_ENV=production` é definido **antes** do `npm run build`.
> - Os `ARG` no topo capturam variáveis que o Coolify injeta automaticamente e evitam conflitos.

---

### 2.2. `docker-entrypoint.sh`

```bash
#!/bin/sh
set -e

echo "=== SGH Docker Entrypoint ==="

# Aplica migrações do Prisma automaticamente (se houver)
if [ -f "node_modules/.prisma/client/index.js" ]; then
  echo "Aplicando migrações do banco..."
  npx prisma migrate deploy || echo "Aviso: migrações não aplicadas (verifique DATABASE_URL)"
fi

echo "Iniciando aplicação..."
exec "$@"
```

> [!TIP]
> Se o projeto não usar Prisma, remova o bloco de migrações e mantenha apenas o `exec "$@"`.

---

### 2.3. `.dockerignore`

```
node_modules
.next
.git
.env
.env*.local
release
npm-debug.log*
```

---

### 2.4. `app/global-error.tsx` (OBRIGATÓRIO para Next.js 14+/React 19)

```tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0f172a', color: '#e2e8f0' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Erro inesperado</h1>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              Ocorreu um problema no sistema. Tente novamente.
            </p>
            <button onClick={() => reset()} style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

> [!CAUTION]
> **Sem este arquivo, o build Docker SEMPRE falhará** no Next.js 14+/React 19.  
> A página `/_global-error` é renderizada FORA do root layout e não tem acesso a providers (ThemeProvider, SessionProvider).  
> Ela DEVE usar `'use client'`, ter seu próprio `<html>/<body>` e usar apenas estilos inline.

---

### 2.5. Diretiva `dynamic` nos Layouts e Páginas

Em projetos com autenticação, banco de dados ou hooks React, adicione em:

**`app/layout.tsx`** (layout raiz):
```tsx
export const dynamic = 'force-dynamic';
```

**`app/(dashboard)/layout.tsx`** (layout protegido, se existir):
```tsx
export const dynamic = 'force-dynamic';
```

**Qualquer página com `redirect()`, `getServerSession()` ou acesso ao banco:**
```tsx
export const dynamic = 'force-dynamic';
```

> [!WARNING]
> Sem `force-dynamic`, o Next.js tenta pré-renderizar as páginas como HTML estático durante o build Docker. Como não há banco, sessão ou browser disponíveis nesse momento, ele falha com:
> ```
> TypeError: Cannot read properties of null (reading 'useState')
> Export encountered an error on /pagina, exiting the build.
> ```

---

### 2.6. Dependências no `package.json`

Garanta que estas dependências estejam em `dependencies` (não `devDependencies`):

```json
{
  "dependencies": {
    "tailwindcss": "...",
    "postcss": "...",
    "autoprefixer": "...",
    "react-is": "..."
  }
}
```

E o script `start`:
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

---

## 3. Criar o Banco PostgreSQL no Coolify

> [!NOTE]
> Se o projeto compartilha o mesmo banco do SGH, pule para o passo 4.

1. No Coolify: **Projects** → Selecione o projeto → **+ New Resource** → **PostgreSQL**
2. Defina o nome (ex: `meu-projeto-db`)
3. Clique em **Start**
4. Em **Public access**: selecione `Public through TCP proxy`, porta `5432`
5. Clique em **Restart**

### Dados de conexão:
- **Host interno**: Nome do container (visível em General → Name)
- **Host externo**: `169.58.246.70`
- **Porta**: `5432`
- **Usuário**: `postgres`
- **Senha**: Visível no campo Password (clique no olho 👁️)

---

## 4. Popular o Banco de Dados

### Opção A: Pelo pgAdmin (Recomendado)

1. Acesse o pgAdmin pela URL do Coolify
2. Conecte ao servidor:
   - **Host**: `169.58.246.70`
   - **Port**: `5432`
   - **Username**: `postgres`
   - **Password**: (senha do container)
3. Clique com botão direito no banco → **Query Tool**
4. Cole o conteúdo do arquivo SQL completo do projeto
5. Clique em **Executar (F5)**
6. Aguarde: `Query returned successfully` + `COMMIT`

### Opção B: Pelo Terminal do Container

1. No Coolify, abra o recurso PostgreSQL → **Terminal**
2. Execute:
   ```bash
   psql -U postgres -d postgres
   ```
3. Cole o SQL e pressione Enter

---

## 5. Criar a Aplicação no Coolify

1. **Projects** → Selecione ou crie um projeto → **+ New Resource** → **Application**
2. Selecione **GitHub** como fonte
3. Escolha o repositório e a branch `main`
4. Em **Build Pack**: selecione **Dockerfile**
5. Em **General**:
   - **FQDN/Domains**: `http://meudominio.com.br` (ou `https://`)
   - **Port Exposes**: `3002` (ou a porta definida no Dockerfile)

---

## 6. Configurar Variáveis de Ambiente

No Coolify, aba **Environment Variables** da aplicação, adicione:

| Variável | Valor | Build? | Runtime? |
|----------|-------|--------|----------|
| `DATABASE_URL` | `postgresql://postgres:SENHA@169.58.246.70:5432/postgres` | ❌ | ✅ |
| `NEXTAUTH_URL` | `https://meudominio.com.br` | ❌ | ✅ |
| `NEXTAUTH_SECRET` | *(chave aleatória 32+ chars)* | ❌ | ✅ |
| `ENCRYPTION_KEY` | *(chave hex 64 chars)* | ❌ | ✅ |
| `NODE_ENV` | `production` | ❌ | ✅ |
| `PORT` | `3002` | ❌ | ✅ |

> [!IMPORTANT]
> **NÃO marque** `Available at Buildtime` para `NODE_ENV=production`, pois isso faz o `npm install` pular devDependencies necessárias para compilar (tailwindcss, typescript, etc.).  
> O Dockerfile já cuida do NODE_ENV correto em cada fase.

---

## 7. Deploy

1. Clique em **Deploy** no Coolify
2. Acompanhe em **Deployment Logs**
3. O build leva ~2 minutos
4. Status final esperado: **Running**

---

## 8. Configurar SSL/HTTPS

Na aba **General** da aplicação, na seção **Labels**, adicione estas linhas:

```
traefik.http.routers.https-0-CONTAINER_ID.entryPoints=https
traefik.http.routers.https-0-CONTAINER_ID.rule=Host(`meudominio.com.br`) && PathPrefix(`/`)
traefik.http.routers.https-0-CONTAINER_ID.service=http-0-CONTAINER_ID
traefik.http.routers.https-0-CONTAINER_ID.tls=true
traefik.http.routers.https-0-CONTAINER_ID.tls.certresolver=letsencrypt
traefik.http.routers.https-0-CONTAINER_ID.middlewares=gzip
traefik.http.routers.http-0-CONTAINER_ID.middlewares=redirect-to-https
```

> Substitua `CONTAINER_ID` pelo ID que já aparece nas labels existentes (ex: `dbrgee53ievcuooc231yfqww`).

Clique em **Save** e **Restart**.

---

## 9. Checklist de Verificação

Antes de cada deploy, confirme:

- [ ] `app/global-error.tsx` existe com `'use client'` e `<html>/<body>` próprios
- [ ] `Dockerfile` com `NODE_ENV=development` antes do `npm install`
- [ ] `Dockerfile` com `NODE_ENV=production` antes do `npm run build`
- [ ] `Dockerfile` com `ARG` para variáveis que o Coolify injeta
- [ ] `.dockerignore` com `node_modules`, `.next`, `.git`, `.env`
- [ ] `docker-entrypoint.sh` existe e é executável
- [ ] Layouts com `export const dynamic = 'force-dynamic'`
- [ ] `tailwindcss`, `postcss`, `autoprefixer` em `dependencies` (não devDependencies)
- [ ] `package-lock.json` sincronizado (rodar `npm install --legacy-peer-deps` localmente)
- [ ] Banco PostgreSQL rodando e populado com o SQL do projeto
- [ ] Variáveis de ambiente configuradas no Coolify (sem marcar "Available at Buildtime")

---

## 10. Troubleshooting — Erros Comuns

### Erro: `TypeError: Cannot read properties of null (reading 'useState')`
**Causa**: Next.js tentou pré-renderizar uma página com hooks React durante o build.  
**Solução**: Adicionar `export const dynamic = 'force-dynamic'` no layout pai da página.

### Erro: `Export encountered an error on /_global-error`
**Causa**: Arquivo `app/global-error.tsx` não existe ou usa providers externos.  
**Solução**: Criar o arquivo conforme a [seção 2.4](#24-appglobal-errortsx-obrigatório-para-nextjs-14react-19).

### Erro: `Cannot find module 'tailwindcss'`
**Causa**: `tailwindcss` está em `devDependencies` e `NODE_ENV=production` durante o `npm install`.  
**Solução**: Mover para `dependencies` no `package.json`.

### Erro: `npm ci - lock file's X does not satisfy Y`
**Causa**: `package-lock.json` desatualizado.  
**Solução**: Rodar `npm install --legacy-peer-deps` localmente e comitar o `package-lock.json`.

### Erro: `NEXTAUTH_SECRET não configurado`
**Causa**: Variável não disponível em tempo de build.  
**Solução**: Adicionar fallback no `lib/auth.ts` ou no Dockerfile como `ENV`.

### Erro: `non-standard NODE_ENV value`
**Causa**: Coolify injeta `NODE_ENV` como ARG de build que conflita.  
**Solução**: Definir `ENV NODE_ENV=production` explicitamente no Dockerfile antes do `npm run build`.

### Erro: `connection refused` no pgAdmin
**Causa**: pgAdmin e PostgreSQL em projetos/redes Docker separadas.  
**Solução**: Ativar `Public through TCP proxy` no PostgreSQL e conectar via IP da VPS (`169.58.246.70:5432`).

### Erro: `ERR_CERT_AUTHORITY_INVALID` no navegador
**Causa**: Certificado SSL não configurado.  
**Solução**: Adicionar labels HTTPS do Traefik conforme [seção 8](#8-configurar-sslhttps), ou acessar temporariamente via `http://`.

---

## Portas por Projeto

| Projeto | Porta | Domínio |
|---------|-------|---------|
| SGH | 3002 | sgh.pajotech.com.br |
| Projeto 2 | 3003 | *(definir)* |
| Projeto 3 | 3004 | *(definir)* |
| Projeto 4 | 3005 | *(definir)* |

---

> **Última atualização**: 27/08/2026  
> **Autor**: Deploy SGH — Pajo Tecnologia
