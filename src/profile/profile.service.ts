import { Injectable, NotFoundException } from '@nestjs/common';

import { NutritionService } from '../nutrition/nutrition.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertProfileDto } from './dto';

function ageFromBirthDate(birthDate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
  return age;
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nutrition: NutritionService,
  ) {}

  async get(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Perfil ainda não cadastrado');
    const target = await this.prisma.dailyTarget.findFirst({
      where: { profileId: profile.id },
      orderBy: { effectiveFrom: 'desc' },
    });
    return { profile, targets: target };
  }

  async upsert(userId: string, dto: UpsertProfileDto) {
    const birthDate = new Date(dto.birthDate);
    const data = {
      sex: dto.sex,
      birthDate,
      heightCm: dto.heightCm,
      weightKg: dto.weightKg,
      targetWeightKg: dto.targetWeightKg,
      activityLevel: dto.activityLevel,
      goal: dto.goal,
    };

    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    const computed = this.nutrition.compute({
      sex: profile.sex,
      age: ageFromBirthDate(profile.birthDate),
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityLevel: profile.activityLevel,
      goal: profile.goal,
    });

    const targets = await this.prisma.dailyTarget.create({
      data: { profileId: profile.id, ...computed },
    });

    return { profile, targets };
  }
}
