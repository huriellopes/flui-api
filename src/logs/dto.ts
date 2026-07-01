import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateWaterDto {
  @IsInt()
  @Min(1)
  waterMl!: number;
}

export class CreateMealDto {
  @IsString()
  @MinLength(1)
  label!: string;

  @IsInt()
  @Min(0)
  calories!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  proteinG?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  carbsG?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  fatG?: number;
}

export class CreateWorkoutDto {
  @IsString()
  @MinLength(1)
  workoutKind!: string;

  @IsInt()
  @Min(1)
  durationMin!: number;
}
