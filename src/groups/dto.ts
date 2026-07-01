import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, MinLength } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ description: 'Nome do grupo de gamificação.', example: 'Time Hidratado', minLength: 2 })
  @IsString()
  @MinLength(2)
  name!: string;
}

export class JoinGroupDto {
  @ApiProperty({
    description: 'Código de convite recebido do criador do grupo.',
    example: 'AB12CD',
    minLength: 4,
    maxLength: 12,
  })
  @IsString()
  @Length(4, 12)
  inviteCode!: string;
}
