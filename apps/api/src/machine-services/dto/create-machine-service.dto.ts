import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMachineServiceDto {
  @IsUUID()
  machineId!: string;

  @IsUUID()
  producerId!: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;

  @IsOptional()
  @IsUUID()
  operatorId?: string;

  @IsString()
  @MaxLength(150)
  serviceType!: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
