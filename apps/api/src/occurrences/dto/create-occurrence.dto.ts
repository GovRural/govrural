import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { OccurrencePriority, OccurrenceType } from '@prisma/client';

export class CreateOccurrenceDto {
  @IsEnum(OccurrenceType)
  type!: OccurrenceType;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(4000)
  description!: string;

  @IsOptional()
  @IsEnum(OccurrencePriority)
  priority?: OccurrencePriority;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
