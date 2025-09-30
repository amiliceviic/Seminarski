FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache curl

COPY package*.json ./

RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev --no-audit --no-fund; \
    else \
      npm install --omit=dev --no-audit --no-fund; \
    fi

COPY src ./src

EXPOSE 3000
CMD ["node", "src/server.js"]
