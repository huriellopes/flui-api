import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ description: 'Texto/descrição do post.', example: 'Bati minha meta de água hoje! 💧', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  caption!: string;

  @ApiPropertyOptional({
    description: 'Imagem opcional codificada em base64 (sem o prefixo data URI).',
    example: 'iVBORw0KGgoAAAANSUhEUgAA...',
  })
  @IsOptional()
  @IsString()
  imageBase64?: string;

  @ApiPropertyOptional({ description: 'MIME type da imagem enviada.', example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  imageMime?: string;
}

export class CreateCommentDto {
  @ApiProperty({ description: 'Texto do comentário.', example: 'Parabéns, mandou bem!', minLength: 1, maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;
}
