// Lógica pura de gamificação (espelhada no app).

export const XP_REWARDS = {
  WATER: 5,
  MEAL: 10,
  WORKOUT: 25,
} as const;

const XP_PER_LEVEL = 100;

export function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: string | null;
}

function dayBefore(day: string): string {
  const d = new Date(day + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function touchStreak(state: StreakState, today: string): StreakState {
  if (state.lastActiveDay === today) return state;
  const nextStreak = state.lastActiveDay === dayBefore(today) ? state.currentStreak + 1 : 1;
  return {
    currentStreak: nextStreak,
    longestStreak: Math.max(state.longestStreak, nextStreak),
    lastActiveDay: today,
  };
}
