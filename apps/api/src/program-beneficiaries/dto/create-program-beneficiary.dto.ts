import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProgramBeneficiaryDto {
  @IsUUID()
  producerId!: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsString()
  @MaxLength(150)
  benefitType!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;
}
