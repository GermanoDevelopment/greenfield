# Stage 1: Build da aplicação frontend
FROM node:20-alpine AS builder

WORKDIR /app

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
