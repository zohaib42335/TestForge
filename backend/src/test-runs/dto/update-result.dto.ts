import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TestStatus } from '@prisma/client';

export class UpdateResultDto {
  @IsEnum(TestStatus)
  result: TestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
