import { calcBMR, calcTDEE, calcTargets, type CalcInput } from './nutrition';

describe('nutrition (motor de cálculo)', () => {
  const male: CalcInput = {
    sex: 'MALE',
    age: 29,
    heightCm: 178,
    weightKg: 82,
    activityLevel: 'MODERATE',
    goal: 'LOSE_FAT',
  };

  const female: CalcInput = {
    sex: 'FEMALE',
    age: 30,
    heightCm: 165,
    weightKg: 60,
    activityLevel: 'SEDENTARY',
    goal: 'MAINTAIN',
  };

  describe('calcBMR (Mifflin-St Jeor)', () => {
    it('calcula BMR masculino (+5)', () => {
      // 10*82 + 6.25*178 - 5*29 + 5 = 1792.5
      expect(calcBMR(male)).toBeCloseTo(1792.5, 1);
    });

    it('calcula BMR feminino (-161)', () => {
      // 10*60 + 6.25*165 - 5*30 - 161 = 1320.25
      expect(calcBMR(female)).toBeCloseTo(1320.25, 1);
    });
  });

  describe('calcTDEE', () => {
    it('aplica o fator de atividade MODERATE (1.55)', () => {
      expect(calcTDEE(male)).toBeCloseTo(1792.5 * 1.55, 1);
    });

    it('aplica o fator SEDENTARY (1.2)', () => {
      expect(calcTDEE(female)).toBeCloseTo(1320.25 * 1.2, 1);
    });
  });

  describe('calcTargets', () => {
    it('aplica déficit de 20% para perder gordura', () => {
      const t = calcTargets(male);
      expect(t.bmr).toBe(1793);
      expect(t.tdee).toBe(2778);
      expect(t.calories).toBe(2223); // 2778.375 * 0.8
    });

    it('usa 2.0 g/kg de proteína quando ativo e com objetivo', () => {
      const t = calcTargets(male);
      expect(t.proteinG).toBe(164); // 2.0 * 82
      expect(t.fatG).toBe(74); // 0.9 * 82 -> 73.8
    });

    it('usa 1.6 g/kg de proteína quando sedentário', () => {
      const t = calcTargets(female);
      expect(t.proteinG).toBe(96); // 1.6 * 60
    });

    it('mantém calorias = TDEE no objetivo MAINTAIN', () => {
      const t = calcTargets(female);
      expect(t.calories).toBe(t.tdee);
    });

    it('arredonda a água para múltiplos de 50 ml', () => {
      const t = calcTargets(male); // 35 * 82 = 2870 -> 2850
      expect(t.waterMl % 50).toBe(0);
      expect(t.waterMl).toBe(2850);
    });

    it('nunca retorna carboidratos negativos', () => {
      const extreme = calcTargets({ ...male, weightKg: 200, goal: 'LOSE_FAT' });
      expect(extreme.carbsG).toBeGreaterThanOrEqual(0);
    });
  });
});
