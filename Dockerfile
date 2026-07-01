# ---- build ----
# Debian slim (não Alpine) para evitar problemas do Prisma com libssl/musl.
FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate && npm run build

# ---- runtime ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl wget && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
EXPOSE 3000
# Fase de prototipagem: sincroniza o schema no boot (db push) e sobe a API.
# TODO: migrar para "prisma migrate deploy" quando o schema estabilizar.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main"]
