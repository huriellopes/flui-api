# 💧 Flui — API

Backend do app [flui](https://github.com/huriellopes/flui). Feito com **NestJS + Prisma + PostgreSQL**, empacotado em Docker para rodar no servidor (Contabo) atrás do Nginx Proxy Manager, com **deploy zero-downtime** e **monitoramento via Telegram**.

## Recursos

- `GET  /api/health` — health check
- `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` — autenticação (JWT)
- `GET/PUT /api/profile` — perfil + cálculo/persistência de metas
- `POST /api/logs/{water,meal,workout}` · `GET /api/logs/today` — registros + XP
- `POST /api/groups` · `POST /api/groups/join` · `GET /api/groups` · `GET /api/groups/:id/ranking`
- Feed: posts, curtidas e comentários; upload de avatar/foto (base64)
- Motor de cálculo nutricional (`src/nutrition`) e schema Prisma completo do domínio

## 📖 Documentação (OpenAPI / Swagger)

Gerada automaticamente em **`/docs`** (JSON em `/docs-json`):

- Produção: `https://flui-api.cantinbr.com.br/docs`
- Local: `http://localhost:3000/docs`

Protegida por **Basic Auth** (`DOCS_USER` / `DOCS_PASSWORD`) enquanto privada; defina **`DOCS_PUBLIC=true`** para liberar.

## 🔒 Segurança

- **Rate limiting** global (`@nestjs/throttler`, 120 req/min por IP) e reforçado no login/registro (5/min) contra brute-force
- `trust proxy` para obter o IP real do cliente atrás do Nginx Proxy Manager
- **Helmet** (HSTS, no-sniff, frameguard, remove `x-powered-by`) e **CORS** configurável (`CORS_ORIGINS`)
- **Validação estrita** (`whitelist` + `forbidNonWhitelisted`) — descarta campos desconhecidos
- **SQL injection**: Prisma parametrizado (zero SQL raw)
- Campos sensíveis (senha, token, imagem) são ocultados nos alertas do Telegram

## 📡 Monitoramento (Telegram)

Erros, warnings, 4xx, crashes e avisos de start/stop são enviados ao Telegram (bot `@fluiapp_bot`), roteados por severidade em tópicos do grupo. Configuração via variáveis `TELEGRAM_*` (veja `.env.example`). Sem `TELEGRAM_BOT_TOKEN`, o monitoramento fica desativado (no-op). Teste rápido: `npm run telegram:test`.

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

## Deploy no Contabo (zero-downtime)

A stack sobe um Postgres dedicado (`flui-db`) e a API (`flui-api`) na rede isolada `flui-net`, **sem porta pública** — publicada pelo Nginx Proxy Manager (forward para `flui-api:3000`, SSL Let's Encrypt).

O deploy (CI em push na `main`) roda [`scripts/rollout.sh`](./scripts/rollout.sh), uma estratégia **blue-green**: builda a nova imagem com a API atual no ar, sobe um container novo compartilhando o alias `flui-api`, espera ficar **healthy** e só então remove o antigo — sem downtime. Se a nova versão não subir saudável, o deploy falha e a versão atual é mantida.

```bash
cp .env.example .env      # POSTGRES_PASSWORD, JWT_SECRET (openssl rand -hex 32), DATABASE_URL, TELEGRAM_*
bash scripts/rollout.sh   # build + troca sem downtime
# no Nginx Proxy Manager: Proxy Host -> forward para flui-api:3000
# (conecte o container 'proxy' à rede flui-net)
```

## Estrutura

```
src/
├─ main.ts               # bootstrap (prefixo /api, helmet, CORS, trust proxy, Swagger)
├─ app.module.ts         # módulos + /health + throttler
├─ telegram/             # notificador + service (monitoramento)
├─ common/               # filtro global de exceções + logger p/ Telegram
├─ prisma/               # PrismaService (global)
├─ auth/ users/ profile/ logs/ groups/ posts/   # domínios
└─ nutrition/            # cálculo BMR/TDEE/macros/água (funções puras)
prisma/schema.prisma · Dockerfile · docker-compose.yml · scripts/rollout.sh
```

## Fluxo de contribuição

Trabalho na branch **`dev`** → Pull Request para **`main`** (protegida, exige PR). Não usar *squash merge*.
