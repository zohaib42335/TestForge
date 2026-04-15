import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TestPriority, TestSeverity, TestType } from '@prisma/client';

class TestStepDto {
  @IsString()
  @Length(1, 2000)
  step: string;

  @IsString()
  @Length(1, 2000)
  expected: string;
}

export class CreateTestCaseDto {
  @IsString()
  @Length(3, 200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  preConditions?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestStepDto)
  testSteps: TestStepDto[];

  @IsOptional()
  @IsString()
  expectedResult?: string;

  @IsOptional()
  @IsString()
  suiteId?: string;

  @IsOptional()
  @IsEnum(TestPriority)
  priority?: TestPriority;

  @IsOptional()
  @IsEnum(TestSeverity)
  severity?: TestSeverity;

  @IsOptional()
  @IsEnum(TestType)
  testType?: TestType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  assignedToId?: string;
}
