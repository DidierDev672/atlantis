# Etapa 1: Build de React + Vite
FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_REST=https://aloja.dcsolutions.systems/api
ENV VITE_API_REST=${VITE_API_REST}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Servidor Nginx ligero para estáticos SPA
FROM nginx:1.27-alpine

COPY nginx.spa.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
