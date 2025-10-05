FROM node:18-bullseye-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/*
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund --legacy-peer-deps
COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.27-alpine
RUN apk add --no-cache curl
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
