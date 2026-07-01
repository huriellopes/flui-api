import { Injectable } from '@nestjs/common';

import { XP_REWARDS } from '../gamification/gamification';
import { GamificationService } from '../gamification/gamification.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMealDto, CreateWaterDto, CreateWorkoutDto } from './dto';

@Injectable()
export class LogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
  ) {}

  async addWater(userId: string, dto: CreateWaterDto) {
    const log = await this.prisma.intakeLog.create({
      data: { userId, type: 'WATER', waterMl: dto.waterMl },
    });
    await this.gamification.award(userId, XP_REWARDS.WATER);
    return log;
  }

  async addMeal(userId: string, dto: CreateMealDto) {
    const log = await this.prisma.intakeLog.create({
      data: {
        userId,
        type: 'MEAL',
        label: dto.label,
        calories: dto.calories,
        proteinG: dto.proteinG ?? 0,
        carbsG: dto.carbsG ?? 0,
        fatG: dto.fatG ?? 0,
      },
    });
    await this.gamification.award(userId, XP_REWARDS.MEAL);
    return log;
  }

  async addWorkout(userId: string, dto: CreateWorkoutDto) {
    const log = await this.prisma.intakeLog.create({
      data: { userId, type: 'WORKOUT', workoutKind: dto.workoutKind, durationMin: dto.durationMin },
    });
    await this.gamification.award(userId, XP_REWARDS.WORKOUT);
    return log;
  }

  /** Resumo do dia atual: soma de água e macros + treinos. */
  async today(userId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const logs = await this.prisma.intakeLog.findMany({
      where: { userId, loggedAt: { gte: start } },
      orderBy: { loggedAt: 'asc' },
    });

    const summary = {
      waterMl: 0,
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      workouts: 0,
    };
    for (const l of logs) {
      if (l.type === 'WATER') summary.waterMl += l.waterMl ?? 0;
      if (l.type === 'MEAL') {
        summary.calories += l.calories ?? 0;
        summary.proteinG += l.proteinG ?? 0;
        summary.carbsG += l.carbsG ?? 0;
        summary.fatG += l.fatG ?? 0;
      }
      if (l.type === 'WORKOUT') summary.workouts += 1;
    }

    return { summary, logs };
  }
}
