import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { CommentType } from '@prisma/client';

export class CreateCommentDto {
  @IsString()
  @Length(1, 1000)
  text: string;

  @IsOptional()
  @IsEnum(CommentType)
  type?: CommentType = CommentType.COMMENT;
}
