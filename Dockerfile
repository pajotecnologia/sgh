FROM node:22-alpine

WORKDIR /app

# Copia os arquivos de pacotes primeiro
COPY package*.json ./

# Instala as dependências de forma limpa (sem o erro do Prisma)
RUN npm ci

# Copia o restante do código
COPY . .

# Executa o build caso use TypeScript ou Next.js (se não usar, não tem problema)
RUN npm run build --if-present

# Gera os arquivos do Prisma Client se o seu projeto usar Prisma
RUN npx prisma generate --if-present

# Expõe a porta que está configurada no seu Coolify (3002)
EXPOSE 3002

# Comando para iniciar sua aplicação
CMD ["npm", "start"]
