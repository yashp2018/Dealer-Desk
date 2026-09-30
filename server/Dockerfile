# ── Build stage ──────────────────────────────────────────────────────────
FROM node:20-slim AS build
WORKDIR /app

# Prisma's query engine needs OpenSSL to detect which build to use — without
# it, `prisma generate`/the runtime engine fall back to guessing (Prisma's own
# warning), which can pick a binary that doesn't match this image and fail at
# the first real query rather than at build time.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Runtime stage ────────────────────────────────────────────────────────
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000
CMD ["node", "dist/server.js"]
