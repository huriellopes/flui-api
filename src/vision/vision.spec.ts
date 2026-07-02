import { extractJson, normalizeMealJson } from './vision.types';

describe('normalizeMealJson', () => {
  it('mapeia as chaves do prompt e coage strings para número', () => {
    const r = normalizeMealJson(
      {
        dish: 'Frango com batatas',
        calories_kcal: '780',
        protein_g: '52',
        carbs_g: '70,5',
        fat_g: 30,
        portion: '1 prato',
        confidence: 'medium',
      },
      'ollama:test',
    );
    expect(r).toEqual({
      dish: 'Frango com batatas',
      calories: 780,
      proteinG: 52,
      carbsG: 71, // 70,5 -> arredonda
      fatG: 30,
      portion: '1 prato',
      confidence: 'medium',
      provider: 'ollama:test',
    });
  });

  it('usa defaults seguros quando faltam campos ou valores são inválidos', () => {
    const r = normalizeMealJson({ calories_kcal: -5, protein_g: 'abc' }, 'ollama:test');
    expect(r.dish).toBe('Refeição');
    expect(r.calories).toBe(0); // negativo -> 0
    expect(r.proteinG).toBe(0); // não numérico -> 0
    expect(r.portion).toBe('porção estimada');
    expect(r.confidence).toBe('low'); // valor ausente/desconhecido -> low
  });

  it('normaliza confidence desconhecida para low', () => {
    expect(normalizeMealJson({ confidence: 'altíssima' }, 'x').confidence).toBe('low');
    expect(normalizeMealJson({ confidence: 'HIGH' }, 'x').confidence).toBe('high');
  });
});

describe('extractJson', () => {
  it('parseia JSON puro', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('extrai o bloco JSON de um texto livre (modelo tagarela)', () => {
    const txt = 'Claro! Aqui está: {"dish":"X","calories_kcal":500} espero ter ajudado.';
    expect(extractJson(txt)).toEqual({ dish: 'X', calories_kcal: 500 });
  });

  it('retorna objeto vazio quando não há JSON', () => {
    expect(extractJson('sem json aqui')).toEqual({});
    expect(extractJson('')).toEqual({});
  });
});
