import { Logger } from '@nestjs/common';

import { MEAL_PROMPT, MealAnalysis, normalizeMealJson, VisionProvider } from './vision.types';

/**
 * Provedor de visão via Ollama (self-hosted). Aponte OLLAMA_URL para o host
 * (idealmente com GPU) rodando um modelo de visão, ex.: qwen2.5vl:7b / llava:7b.
 */
export class OllamaVisionProvider implements VisionProvider {
  readonly name: string;
  private readonly logger = new Logger('OllamaVision');

  constructor(
    private readonly url: string,
    private readonly model: string,
    private readonly timeoutMs: number,
  ) {
    this.name = `ollama:${model}`;
  }

  async analyzeMeal(imageBase64: string): Promise<MealAnalysis> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.url.replace(/\/$/, '')}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          prompt: MEAL_PROMPT,
          images: [imageBase64],
          stream: false,
          format: 'json', // Ollama garante JSON válido na resposta.
          options: { temperature: 0 },
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Ollama ${res.status}: ${body.slice(0, 200)}`);
      }

      const data = (await res.json()) as { response?: string };
      const parsed = JSON.parse(data.response ?? '{}');
      return normalizeMealJson(parsed, this.name);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Falha ao analisar imagem: ${msg}`);
      throw new Error(`vision_provider_failed: ${msg}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
