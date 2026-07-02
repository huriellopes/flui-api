/** Resultado da análise nutricional de uma foto de refeição. */
export interface MealAnalysis {
  /** Nome/descrição do prato identificado. */
  dish: string;
  /** Calorias estimadas do prato inteiro (kcal). */
  calories: number;
  /** Proteínas estimadas (g). */
  proteinG: number;
  /** Carboidratos estimados (g). */
  carbsG: number;
  /** Gorduras estimadas (g). */
  fatG: number;
  /** Porção assumida na estimativa (ex.: "1 prato ~450g"). */
  portion: string;
  /** Confiança da estimativa. */
  confidence: 'low' | 'medium' | 'high';
  /** Provedor/modelo usado (para telemetria). */
  provider: string;
}

/** Contrato de qualquer provedor de visão (Ollama, Claude, etc.). */
export interface VisionProvider {
  readonly name: string;
  /** Analisa a imagem (base64, sem prefixo data URI) e retorna os macros. */
  analyzeMeal(imageBase64: string, mime?: string): Promise<MealAnalysis>;
}

/** Instrução compartilhada entre provedores para forçar a saída estruturada. */
export const MEAL_PROMPT =
  'You are a nutrition assistant. Look at the food in this image and estimate the ' +
  'TOTAL nutrition for the whole plate (sum of all items). Assume a typical portion ' +
  'if unsure. Reply ONLY with JSON using exactly these keys: ' +
  '{"dish": string (short name, in Portuguese), "calories_kcal": number, ' +
  '"protein_g": number, "carbs_g": number, "fat_g": number, ' +
  '"portion": string (assumed portion, in Portuguese), ' +
  '"confidence": "low" | "medium" | "high"}. Numbers only, no ranges, no units in numbers.';

/** Normaliza a resposta bruta (chaves do prompt) para o MealAnalysis. */
export function normalizeMealJson(raw: unknown, provider: string): MealAnalysis {
  const o = (raw ?? {}) as Record<string, unknown>;
  const num = (v: unknown): number => {
    const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
  };
  const conf = String(o.confidence ?? 'low').toLowerCase();
  return {
    dish: String(o.dish ?? '').trim() || 'Refeição',
    calories: num(o.calories_kcal ?? o.calories),
    proteinG: num(o.protein_g ?? o.protein),
    carbsG: num(o.carbs_g ?? o.carbs),
    fatG: num(o.fat_g ?? o.fat),
    portion: String(o.portion ?? '').trim() || 'porção estimada',
    confidence: conf === 'high' ? 'high' : conf === 'medium' ? 'medium' : 'low',
    provider,
  };
}

/**
 * Extrai um objeto JSON de um texto livre (modelos que não garantem JSON puro).
 * Tenta o texto inteiro; se falhar, pega o primeiro bloco {...}.
 */
export function extractJson(text: string): unknown {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return {};
      }
    }
    return {};
  }
}
