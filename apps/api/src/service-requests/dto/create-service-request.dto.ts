import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ServiceRequestPriority } from '@prisma/client';

export class CreateServiceRequestDto {
  @IsUUID()
  producerId!: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsUUID()
  departmentId!: string;

  @IsUUID()
  serviceTypeId!: string;

  @IsString()
  @MaxLength(4000)
  description!: string;

  @IsOptional()
  @IsEnum(ServiceRequestPriority)
  priority?: ServiceRequestPriority;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
