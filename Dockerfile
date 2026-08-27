FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

# 1. Copia os arquivos de pacotes e o .npmrc (resolve o conflito de peer dependencies)
COPY package*.json .npmrc* ./

# 2. Instala todas as dependências necessárias para o build
ENV NODE_ENV=development
RUN npm ci --legacy-peer-deps

# 3. Copia o schema do Prisma e gera o Prisma Client ANTES do build
COPY prisma ./prisma
RUN npx prisma generate

# 4. Copia o restante do código
COPY . .

# 5. Compila a aplicação Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
RUN node scripts/package-release.mjs

# 6. Configurações de execução em produção
ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

EXPOSE 3002

CMD ["npm", "start"]
