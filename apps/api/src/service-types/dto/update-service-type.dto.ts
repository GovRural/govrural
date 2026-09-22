import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { ServiceTypeStatus } from '@prisma/client';
import { CreateServiceTypeDto } from './create-service-type.dto.js';

export class UpdateServiceTypeDto extends PartialType(CreateServiceTypeDto) {
  @IsOptional()
  @IsEnum(ServiceTypeStatus)
  status?: ServiceTypeStatus;
}
