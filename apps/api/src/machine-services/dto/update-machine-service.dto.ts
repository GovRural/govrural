import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { MachineServiceStatus } from '@prisma/client';

// machineId, producerId e serviceType nunca sao editaveis depois de criados.
// Execucao (start/end/horimetro/combustivel) e feita via PATCH /:id/execution.
export class UpdateMachineServiceDto {
  @IsOptional()
  @IsEnum(MachineServiceStatus)
  status?: MachineServiceStatus;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsUUID()
  operatorId?: string;

  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;

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
