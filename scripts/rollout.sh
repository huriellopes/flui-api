#!/usr/bin/env bash
#
# Deploy zero-downtime (blue-green) da Flui API.
#
# Estratégia: constrói a nova imagem com a API atual ainda no ar, sobe um
# container "green" novo compartilhando o alias de rede `flui-api` (então o
# Nginx Proxy Manager já enxerga os dois), espera o green ficar saudável e só
# ENTÃO remove o antigo e promove o green. Se o green não subir saudável, o
# antigo é mantido e o deploy falha — a API nunca fica fora do ar.
#
set -euo pipefail

cd "$(dirname "$0")/.."

log() { echo "[rollout] $*"; }

log "buildando a nova imagem (a API atual continua atendendo)"
docker compose build flui-api
docker compose up -d --wait flui-db

# Nome fixo da imagem da API (definido no docker-compose.yml). Evita depender do
# filtro `--images <service>`, que nesta versão do compose retorna a imagem errada.
IMAGE="flui-api:latest"
log "imagem nova: ${IMAGE}"

# O `docker run --env-file` NÃO remove aspas ao redor dos valores (ao contrário
# do compose). Normalizamos o .env removendo aspas simples/duplas envolventes,
# senão DATABASE_URL="..." chegaria com aspas e o Prisma quebraria.
ENVFILE="$(mktemp)"
trap 'rm -f "$ENVFILE"' EXIT
sed -E "s/^([A-Za-z_][A-Za-z0-9_]*)=\"(.*)\"$/\1=\2/; s/^([A-Za-z_][A-Za-z0-9_]*)='(.*)'$/\1=\2/" .env > "$ENVFILE"

GREEN=flui-api-green
docker rm -f "$GREEN" >/dev/null 2>&1 || true

log "subindo container novo (${GREEN}) com alias de rede flui-api"
docker run -d --name "$GREEN" \
  --network flui-net --network-alias flui-api \
  --env-file "$ENVFILE" \
  --restart unless-stopped \
  -v flui-uploads:/app/uploads \
  "$IMAGE" >/dev/null

log "aguardando o green ficar saudável..."
healthy=""
for _ in $(seq 1 40); do
  if docker exec "$GREEN" wget -qO- http://localhost:3000/api/health >/dev/null 2>&1; then
    healthy=1
    break
  fi
  sleep 2
done

if [ -z "$healthy" ]; then
  log "ERRO: o green não ficou saudável — mantendo a API atual e abortando"
  docker logs --tail 80 "$GREEN" || true
  docker rm -f "$GREEN" || true
  exit 1
fi

log "green saudável — removendo o antigo e promovendo o green a flui-api"
# Enquanto o green está no ar (com alias flui-api), remover o antigo não causa
# downtime: o alias continua resolvendo para o green.
docker rm -f flui-api >/dev/null 2>&1 || true
docker rename "$GREEN" flui-api

log "limpando imagens órfãs"
docker image prune -f >/dev/null 2>&1 || true

log "concluído com zero downtime"
