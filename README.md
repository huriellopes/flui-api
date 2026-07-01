# 💧 Notify Water Health — API

Backend do app [app-notify-water-health](https://github.com/huriellopes/app-notify-water-health). Feito com **NestJS + Prisma + PostgreSQL**, empacotado em Docker para rodar no servidor (Contabo) atrás do Nginx Proxy Manager.

## Status

🚧 Fase 2 (scaffold). Auth (cadastro/login com JWT) e o motor de cálculo já estão modelados; logs, grupos e gamificação social entram na sequência.

Já implementado:
- `GET  /api/health` — health check
- `POST /api/auth/register` — cadastro (nome, e-mail, senha)
- `POST /api/auth/login` — login → `accessToken` (JWT)
- `GET  /api/auth/me` — dados do usuário autenticado (Bearer token)
- Motor de cálculo nutricional (`src/nutrition`) espelhado do app
- Schema Prisma completo do domínio (usuários, perfil, metas, logs, gamificação, grupos, convites)

Próximos (Fase 2):
- `profile` (salvar dados físicos + recalcular metas)
- `logs` (água/refeições/treinos) e sincronização com o app
- `groups` + `invites` (gamificação social e ranking)

## Stack

- NestJS 10 · Prisma 5 · PostgreSQL 16
- Auth JWT (`@nestjs/jwt` + Passport) · senhas com bcrypt
- Docker + docker-compose

## Rodando local

```bash
npm install
cp .env.example .env      # ajuste DATABASE_URL e JWT_SECRET
npm run prisma:migrate    # cria as tabelas
npm run start:dev         # API em http://localhost:3000/api
```

## Deploy no Contabo

A stack sobe um Postgres dedicado (`notifywater-db`) e a API (`notifywater-api`) numa rede isolada `notifywater-net`, **sem porta pública**. A publicação é feita pelo Nginx Proxy Manager já existente no servidor, apontando um subdomínio (ex: `api.SEU-DOMINIO`) para o container `notifywater-api:3000` — com SSL Let's Encrypt automático.

```bash
cp .env.example .env      # defina POSTGRES_PASSWORD, JWT_SECRET (openssl rand -hex 32), DATABASE_URL
docker compose up -d --build
# depois, no Nginx Proxy Manager: novo Proxy Host -> forward para notifywater-api:3000
# (conecte o container 'proxy' à rede notifywater-net)
```

As migrações são aplicadas automaticamente no start do container (`prisma migrate deploy`).

## Estrutura

```
src/
├─ main.ts               # bootstrap (prefixo /api, CORS, validação)
├─ app.module.ts         # módulos + /health
├─ prisma/               # PrismaService (global)
├─ auth/                 # register, login, JWT, guard
├─ users/                # acesso a usuários
└─ nutrition/            # cálculo BMR/TDEE/macros/água (funções puras)
prisma/schema.prisma     # modelo de dados
Dockerfile · docker-compose.yml
```
