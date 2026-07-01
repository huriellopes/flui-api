import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { levelFromXp, touchStreak } from './gamification';

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  /** Concede XP e atualiza nível/sequência do usuário. */
  async award(userId: string, amount: number): Promise<void> {
    const g = await this.prisma.gamification.findUnique({ where: { userId } });
    if (!g) return;

    const today = new Date().toISOString().slice(0, 10);
    const streak = touchStreak(
      {
        currentStreak: g.currentStreak,
        longestStreak: g.longestStreak,
        lastActiveDay: g.lastActiveDay,
      },
      today,
    );
    const xp = g.xp + amount;

    await this.prisma.gamification.update({
      where: { userId },
      data: {
        xp,
        level: levelFromXp(xp),
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActiveDay: streak.lastActiveDay,
      },
    });
  }
}
