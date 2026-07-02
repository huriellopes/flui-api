import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateWaterDto {
  @ApiProperty({
    description: 'Quantidade de água consumida, em mililitros.',
    example: 250,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  waterMl!: number;
}

export class CreateMealDto {
  @ApiProperty({ description: 'Descrição/rótulo da refeição.', example: 'Almoço' })
  @IsString()
  @MinLength(1)
  label!: string;

  @ApiProperty({ description: 'Total de calorias da refeição (kcal).', example: 650, minimum: 0 })
  @IsInt()
  @Min(0)
  calories!: number;

  @ApiPropertyOptional({ description: 'Proteínas em gramas.', example: 40, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  proteinG?: number;

  @ApiPropertyOptional({ description: 'Carboidratos em gramas.', example: 70, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  carbsG?: number;

  @ApiPropertyOptional({ description: 'Gorduras em gramas.', example: 20, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  fatG?: number;
}

export class CreateWorkoutDto {
  @ApiProperty({ description: 'Tipo/modalidade do treino.', example: 'Corrida' })
  @IsString()
  @MinLength(1)
  workoutKind!: string;

  @ApiProperty({ description: 'Duração do treino em minutos.', example: 45, minimum: 1 })
  @IsInt()
  @Min(1)
  durationMin!: number;
}

export class AnalyzeMealPhotoDto {
  @ApiProperty({
    description: 'Foto da refeição em base64 (sem o prefixo data URI).',
    example: 'iVBORw0KGgoAAAANSUhEUgAA...',
  })
  @IsString()
  @MinLength(1)
  imageBase64!: string;

  @ApiPropertyOptional({ description: 'MIME type da imagem.', example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  imageMime?: string;
}
