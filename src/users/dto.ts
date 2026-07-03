import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Novo nome de exibição.',
    example: 'Maria S. Silva',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({
    description: 'Novo e-mail (deve ser único).',
    example: 'maria.nova@exemplo.com',
    format: 'email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdatePasswordDto {
  @ApiProperty({ description: 'Senha atual, para confirmação.', example: 'senhaAntiga123' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({
    description: 'Nova senha (mínimo 8 caracteres).',
    example: 'novaSenhaForte456',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Senha atual, para confirmar a exclusão permanente da conta.',
    example: 'minhaSenha123',
  })
  @IsString()
  password!: string;
}

export class UpdateAvatarDto {
  @ApiProperty({
    description: 'Nova foto de perfil em base64 (sem o prefixo data URI).',
    example: 'iVBORw0KGgoAAAANSUhEUgAA...',
  })
  @IsString()
  imageBase64!: string;

  @ApiPropertyOptional({ description: 'MIME type da imagem enviada.', example: 'image/png' })
  @IsOptional()
  @IsString()
  imageMime?: string;
}
