import { levelFromXp, touchStreak, XP_REWARDS } from './gamification';

describe('gamification (lógica pura)', () => {
  describe('levelFromXp', () => {
    it('nível 1 no início', () => {
      expect(levelFromXp(0)).toBe(1);
      expect(levelFromXp(99)).toBe(1);
    });
    it('sobe de nível a cada 100 XP', () => {
      expect(levelFromXp(100)).toBe(2);
      expect(levelFromXp(250)).toBe(3);
    });
  });

  describe('touchStreak', () => {
    it('inicia sequência em 1 no primeiro dia', () => {
      const s = touchStreak(
        { currentStreak: 0, longestStreak: 0, lastActiveDay: null },
        '2026-07-01',
      );
      expect(s.currentStreak).toBe(1);
      expect(s.longestStreak).toBe(1);
      expect(s.lastActiveDay).toBe('2026-07-01');
    });

    it('incrementa em dias consecutivos', () => {
      const s = touchStreak(
        { currentStreak: 3, longestStreak: 3, lastActiveDay: '2026-06-30' },
        '2026-07-01',
      );
      expect(s.currentStreak).toBe(4);
      expect(s.longestStreak).toBe(4);
    });

    it('zera (reinicia em 1) após pular um dia', () => {
      const s = touchStreak(
        { currentStreak: 5, longestStreak: 5, lastActiveDay: '2026-06-28' },
        '2026-07-01',
      );
      expect(s.currentStreak).toBe(1);
      expect(s.longestStreak).toBe(5); // preserva o recorde
    });

    it('é idempotente no mesmo dia', () => {
      const base = { currentStreak: 2, longestStreak: 4, lastActiveDay: '2026-07-01' };
      expect(touchStreak(base, '2026-07-01')).toBe(base);
    });
  });

  it('expõe recompensas de XP coerentes', () => {
    expect(XP_REWARDS.WATER).toBeLessThan(XP_REWARDS.MEAL);
    expect(XP_REWARDS.MEAL).toBeLessThan(XP_REWARDS.WORKOUT);
  });
});
