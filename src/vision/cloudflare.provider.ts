import { Logger } from '@nestjs/common';

import {
  extractJson,
  MEAL_PROMPT,
  MealAnalysis,
  normalizeMealJson,
  VisionProvider,
} from './vision.types';

/**
 * Provedor de visão via Cloudflare Workers AI (tem free tier com modelos de
 * visão). Não exige infra própria. Modelo padrão: LLaVA 1.5 7B.
 * Requer CF_ACCOUNT_ID e CF_API_TOKEN (token com permissão Workers AI).
 */
export class CloudflareVisionProvider implements VisionProvider {
  readonly name: string;
  private readonly logger = new Logger('CloudflareVision');

  constructor(
    private readonly accountId: string,
    private readonly apiToken: string,
    private readonly model: string,
    private readonly timeoutMs: number,
  ) {
    this.name = `cloudflare:${model}`;
  }

  async analyzeMeal(imageBase64: string): Promise<MealAnalysis> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      // Workers AI (LLaVA) recebe a imagem como array de bytes (0-255).
      const bytes = Array.from(Buffer.from(imageBase64, 'base64'));
      const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${this.model}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          image: bytes,
          prompt: MEAL_PROMPT,
          max_tokens: 512,
          temperature: 0,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Cloudflare ${res.status}: ${body.slice(0, 200)}`);
      }

      // Resposta: { result: { response | description }, success }
      const data = (await res.json()) as {
        result?: { response?: string; description?: string };
      };
      const text = data.result?.response ?? data.result?.description ?? '';
      return normalizeMealJson(extractJson(text), this.name);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Falha ao analisar imagem: ${msg}`);
      throw new Error(`vision_provider_failed: ${msg}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
