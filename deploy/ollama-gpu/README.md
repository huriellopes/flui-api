# Host GPU — Ollama de visão (Flui)

Sobe o **Ollama** com um modelo de visão **gratuito** (`qwen2.5vl:7b`) num host **separado da produção**, atrás de um proxy **Caddy** com **HTTPS** e **token Bearer** (o Ollama não tem autenticação nativa — nunca exponha a porta 11434 direto na internet).

```
[App] -> [API Flui (Contabo)] --https+token--> [Caddy] -> [Ollama+GPU]
```

## Pré-requisitos no host GPU
- GPU NVIDIA + **driver** + **nvidia-container-toolkit** + Docker.
- Um **domínio** (ex.: `ollama.cantinbr.com.br`) com DNS **A** apontando para o IP do host.
- Portas **80** e **443** abertas (Caddy emite o certificado Let's Encrypt).

## Onde hospedar (modelo é grátis; o custo é a GPU)
- **Sob demanda / serverless** (RunPod, Vast.ai, Modal): barato p/ volume baixo, mas tem *cold start*.
- **VPS GPU dedicada 24/7** (Hetzner GPU, OVH, Contabo GPU): sempre quente, ~dezenas de US$/mês.
- VRAM: **8 GB** já roda `qwen2.5vl:7b` quantizado com folga.

## Subir
```bash
cp .env.example .env         # defina OLLAMA_DOMAIN e OLLAMA_TOKEN (openssl rand -hex 32)
docker compose up -d
docker exec flui-ollama ollama pull qwen2.5vl:7b   # baixa o modelo (uma vez)
# teste (deve responder; sem o token, dá 403):
curl -H "Authorization: Bearer $OLLAMA_TOKEN" https://ollama.SEU-DOMINIO/api/tags
```

## Ligar na API (servidor de produção)
No `.env` da API Flui:
```
VISION_PROVIDER=ollama
OLLAMA_URL=https://ollama.SEU-DOMINIO
OLLAMA_API_KEY=<o mesmo OLLAMA_TOKEN>
OLLAMA_VISION_MODEL=qwen2.5vl:7b
```
Depois `docker compose up -d` na API. O endpoint `POST /api/logs/analyze-meal-photo` sai do 503 e passa a responder.
