# syntax=docker/dockerfile:1

# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:22.23.4-alpine3.24 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_* env vars baked at build time — pass via --build-arg
# Nama harus sama dengan yang dibaca kode (src/lib/api-client.ts)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# ── Stage 2: Serve with Nginx (non-root) ─────────────────────────
# nginx-unprivileged berjalan sebagai user nginx (UID 101) dan tidak bisa bind port < 1024,
# karena itu aplikasi listen di 8080.
FROM nginxinc/nginx-unprivileged:1.30.6-alpine3.24 AS runner

# Menimpa default.conf bawaan image
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

USER 101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
