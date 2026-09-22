import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { PropertyOwnershipType } from '@prisma/client';

export class CreatePropertyDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ruralAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  locality?: string;

  @IsNumber()
  @Min(0)
  totalArea!: number;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  carNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  stateRegistration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  propertyType?: string;

  @IsEnum(PropertyOwnershipType)
  ownershipType!: PropertyOwnershipType;
}
