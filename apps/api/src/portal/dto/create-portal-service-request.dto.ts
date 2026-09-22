import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

// producerId nunca vem do body aqui - o portal sempre usa o producerId do
// proprio usuario logado (ver PortalService.createServiceRequest).
export class CreatePortalServiceRequestDto {
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
}
