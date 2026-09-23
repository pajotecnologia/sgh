FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat curl

# Ignora ARGs que o Coolify injeta automaticamente (não usar durante build)
ARG NEXTAUTH_SECRET
ARG ENCRYPTION_KEY
ARG PUSHER_KEY
ARG PUSHER_SECRET

# 1. Copia os arquivos de pacotes e o .npmrc
COPY package*.json .npmrc* ./

# 2. Instala todas as dependências necessárias para o build
ENV NODE_ENV=development
RUN npm install --legacy-peer-deps

# 3. Copia o schema do Prisma e gera o Prisma Client ANTES do build
COPY prisma ./prisma
RUN npx prisma generate

# 4. Copia o restante do código
COPY . .

# 5. Compila a aplicação Next.js
#    Força NODE_ENV=production para o build otimizado
#    Fornece fallbacks para variáveis exigidas em tempo de build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXTAUTH_SECRET="build-fallback-sgh-nextauth-secret-min-32-chars!!"
ENV ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
RUN npm run build
RUN node scripts/package-release.mjs

RUN chmod +x docker-entrypoint.sh

# 6. Configurações de execução em produção
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

EXPOSE 3002

# O entrypoint executa as migrações antes de iniciar o Next.js.\n# O start-period evita que o healthcheck do Docker/Coolify falhe durante essa etapa.\nHEALTHCHECK --interval=10s --timeout=5s --start-period=45s --retries=5 CMD curl -fsS http://127.0.0.1:3002/login >/dev/null || exit 1\n\nENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]

