import { ApiProperty } from '@nestjs/swagger';
import { ActivityLevel, Goal, Sex } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, Max, Min } from 'class-validator';

export class UpsertProfileDto {
  @ApiProperty({
    description: 'Sexo biológico (usado no cálculo de metas).',
    enum: Sex,
    example: Sex.FEMALE,
  })
  @IsEnum(Sex)
  sex!: Sex;

  @ApiProperty({
    description: 'Data de nascimento (ISO 8601).',
    example: '1995-04-20',
    format: 'date',
  })
  @IsDateString()
  birthDate!: string;

  @ApiProperty({ description: 'Altura em centímetros.', example: 168, minimum: 50, maximum: 260 })
  @IsNumber()
  @Min(50)
  @Max(260)
  heightCm!: number;

  @ApiProperty({
    description: 'Peso atual em quilogramas.',
    example: 65,
    minimum: 20,
    maximum: 400,
  })
  @IsNumber()
  @Min(20)
  @Max(400)
  weightKg!: number;

  @ApiProperty({
    description: 'Peso desejado em quilogramas.',
    example: 60,
    minimum: 20,
    maximum: 400,
  })
  @IsNumber()
  @Min(20)
  @Max(400)
  targetWeightKg!: number;

  @ApiProperty({
    description: 'Nível de atividade física (usado no cálculo do gasto calórico).',
    enum: ActivityLevel,
    example: ActivityLevel.MODERATE,
  })
  @IsEnum(ActivityLevel)
  activityLevel!: ActivityLevel;

  @ApiProperty({
    description: 'Objetivo do usuário (perder gordura, manter ou ganhar músculo).',
    enum: Goal,
    example: Goal.LOSE_FAT,
  })
  @IsEnum(Goal)
  goal!: Goal;
}
