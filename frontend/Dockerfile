# Stage 1: Build da aplicação frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Build args para variáveis em tempo de compilação do Vite
ARG VITE_API_URL=/api/v1
ARG VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
ARG VITE_SOLANA_CHAIN=solana:devnet
ARG VITE_SOLANA_PROGRAM_ID
ARG VITE_SOLANA_USDC_MINT

ENV VITE_API_URL=$VITE_API_URL \
    VITE_SOLANA_RPC_URL=$VITE_SOLANA_RPC_URL \
    VITE_SOLANA_CHAIN=$VITE_SOLANA_CHAIN \
    VITE_SOLANA_PROGRAM_ID=$VITE_SOLANA_PROGRAM_ID \
    VITE_SOLANA_USDC_MINT=$VITE_SOLANA_USDC_MINT

# Copia arquivos de dependência para cache
COPY package*.json ./
RUN npm ci

# Copia código-fonte e compila
COPY . .
RUN npm run build

# Stage 2: Servidor de produção com Nginx
FROM nginx:alpine

# Remove configuração padrão do Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copia build da aplicação e configuração customizada
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
