import { ArrayMinSize, IsArray, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class CreateRunDto {
  @IsString()
  @Length(2, 200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  testCaseIds: string[];
}
