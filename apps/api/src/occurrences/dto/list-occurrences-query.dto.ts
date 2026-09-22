import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { OccurrencePriority, OccurrenceStatus, OccurrenceType } from '@prisma/client';

export class ListOccurrencesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(OccurrenceType)
  type?: OccurrenceType;

  @IsOptional()
  @IsEnum(OccurrencePriority)
  priority?: OccurrencePriority;

  @IsOptional()
  @IsEnum(OccurrenceStatus)
  status?: OccurrenceStatus;
}
