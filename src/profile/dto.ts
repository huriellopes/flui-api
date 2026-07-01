import { ActivityLevel, Goal, Sex } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, Max, Min } from 'class-validator';

export class UpsertProfileDto {
  @IsEnum(Sex)
  sex!: Sex;

  @IsDateString()
  birthDate!: string;

  @IsNumber()
  @Min(50)
  @Max(260)
  heightCm!: number;

  @IsNumber()
  @Min(20)
  @Max(400)
  weightKg!: number;

  @IsNumber()
  @Min(20)
  @Max(400)
  targetWeightKg!: number;

  @IsEnum(ActivityLevel)
  activityLevel!: ActivityLevel;

  @IsEnum(Goal)
  goal!: Goal;
}
