import { IsString, MinLength } from 'class-validator';

export class ProjectMemberDto {
  @IsString()
  @MinLength(1)
  userId: string;
}
