import { IsArray, IsEnum, IsString, MinLength } from 'class-validator';
import { TestStatus } from '@prisma/client';

export class BulkUpdateStatusDto {
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  ids: string[];

  @IsEnum(TestStatus)
  status: TestStatus;
}
