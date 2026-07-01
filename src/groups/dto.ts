import { IsString, Length, MinLength } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(2)
  name!: string;
}

export class JoinGroupDto {
  @IsString()
  @Length(4, 12)
  inviteCode!: string;
}
