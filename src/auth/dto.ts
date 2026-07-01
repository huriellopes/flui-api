import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: 'Nome de exibição do usuário.', example: 'Maria Silva', minLength: 2 })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ description: 'E-mail único usado para login.', example: 'maria@exemplo.com', format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Senha com no mínimo 8 caracteres.', example: 'senhaForte123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ description: 'E-mail cadastrado.', example: 'maria@exemplo.com', format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Senha da conta.', example: 'senhaForte123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
