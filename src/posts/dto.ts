import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MaxLength(500)
  caption!: string;

  @IsOptional()
  @IsString()
  imageBase64?: string;

  @IsOptional()
  @IsString()
  imageMime?: string;
}

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;
}
