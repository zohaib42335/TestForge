import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateActivityLogDto {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsString()
  actorId: string;

  @IsString()
  action: string;

  @IsString()
  entityType: string;

  @IsString()
  entityId: string;

  @IsOptional()
  @IsString()
  entityRef?: string;

  @IsOptional()
  @IsObject()
  changes?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
