import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ServiceRequestPriority } from '@prisma/client';

// producerId, departmentId, serviceTypeId e protocol nunca sao editaveis
// depois de criados - protegem a integridade do protocolo e do historico.
// status e alterado apenas via PATCH /service-requests/:id/status.
export class UpdateServiceRequestDto {
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsEnum(ServiceRequestPriority)
  priority?: ServiceRequestPriority;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
