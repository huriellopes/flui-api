// Motor de cálculo nutricional — funções puras (espelhadas no app).
// Referências: Mifflin-St Jeor (BMR), fatores de atividade padrão, macros por g/kg.

export type Sex = 'MALE' | 'FEMALE';
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
export type Goal = 'LOSE_FAT' | 'MAINTAIN' | 'GAIN_MUSCLE';

export interface CalcInput {
  sex: Sex;
  age: number; // anos
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface DailyTargets {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
}

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

const GOAL_CALORIE_FACTOR: Record<Goal, number> = {
  LOSE_FAT: 0.8, // déficit ~20%
  MAINTAIN: 1.0,
  GAIN_MUSCLE: 1.1, // superávit ~10%
};

export function calcBMR(i: CalcInput): number {
  const base = 10 * i.weightKg + 6.25 * i.heightCm - 5 * i.age;
  return i.sex === 'MALE' ? base + 5 : base - 161;
}

export function calcTDEE(i: CalcInput): number {
  return calcBMR(i) * ACTIVITY_FACTORS[i.activityLevel];
}

function proteinPerKg(i: CalcInput): number {
  if (i.activityLevel === 'SEDENTARY') return 1.6;
  return i.goal === 'MAINTAIN' ? 1.8 : 2.0;
}

export function calcTargets(i: CalcInput): DailyTargets {
  const bmr = calcBMR(i);
  const tdee = calcTDEE(i);
  const calories = tdee * GOAL_CALORIE_FACTOR[i.goal];

  const proteinG = proteinPerKg(i) * i.weightKg;
  const fatG = 0.9 * i.weightKg;
  const carbsKcal = Math.max(0, calories - proteinG * 4 - fatG * 9);
  const carbsG = carbsKcal / 4;
  const waterMl = 35 * i.weightKg;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories: Math.round(calories),
    proteinG: Math.round(proteinG),
    carbsG: Math.round(carbsG),
    fatG: Math.round(fatG),
    waterMl: Math.round(waterMl / 50) * 50, // arredonda para múltiplos de 50 ml
  };
}
