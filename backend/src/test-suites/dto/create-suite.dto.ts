import { IsOptional, IsString, Length } from 'class-validator';

export class CreateSuiteDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
