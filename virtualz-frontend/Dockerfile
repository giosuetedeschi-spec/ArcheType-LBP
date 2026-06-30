# syntax=docker/dockerfile:1

# --- Stage 1: build con Node/Vite ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# L'URL del backend va impostato a build-time per Vite (variabili VITE_* sono
# inlineate nel bundle). Sovrascrivibile con --build-arg in docker-compose.
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# --- Stage 2: serve con Nginx ---
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
