import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { CloudflareVisionProvider } from './cloudflare.provider';
import { OllamaVisionProvider } from './ollama.provider';
import { MealAnalysis, VisionProvider } from './vision.types';

/**
 * Serviço de visão com provedor trocável por env (VISION_PROVIDER):
 * - "ollama"     → OLLAMA_URL, OLLAMA_VISION_MODEL, OLLAMA_API_KEY
 * - "cloudflare" → CF_ACCOUNT_ID, CF_API_TOKEN, CF_VISION_MODEL (free tier)
 * - VISION_TIMEOUT_MS: timeout por análise (padrão 60000).
 *
 * Se não estiver configurado, `enabled` é false e o endpoint responde 503.
 */
@Injectable()
export class VisionService {
  private readonly provider: VisionProvider | null = this.buildProvider();

  get enabled(): boolean {
    return this.provider !== null;
  }

  async analyzeMeal(imageBase64: string, mime?: string): Promise<MealAnalysis> {
    if (!this.provider) {
      throw new ServiceUnavailableException(
        'Análise de foto indisponível: o provedor de visão não está configurado.',
      );
    }
    return this.provider.analyzeMeal(imageBase64, mime);
  }

  private buildProvider(): VisionProvider | null {
    const provider = (process.env.VISION_PROVIDER ?? 'ollama').toLowerCase();
    const timeout = Number(process.env.VISION_TIMEOUT_MS ?? 60000);

    if (provider === 'ollama') {
      const url = process.env.OLLAMA_URL;
      const model = process.env.OLLAMA_VISION_MODEL ?? 'qwen2.5vl:7b';
      const apiKey = process.env.OLLAMA_API_KEY || undefined;
      if (!url) return null; // sem host configurado → desativado
      return new OllamaVisionProvider(url, model, timeout, apiKey);
    }

    if (provider === 'cloudflare') {
      const accountId = process.env.CF_ACCOUNT_ID;
      const apiToken = process.env.CF_API_TOKEN;
      const model = process.env.CF_VISION_MODEL ?? '@cf/llava-hf/llava-1.5-7b-hf';
      if (!accountId || !apiToken) return null; // sem credenciais → desativado
      return new CloudflareVisionProvider(accountId, apiToken, model, timeout);
    }

    return null;
  }
}
