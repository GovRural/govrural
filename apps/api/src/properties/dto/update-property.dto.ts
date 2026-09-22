import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { PropertyStatus } from '@prisma/client';
import { CreatePropertyDto } from './create-property.dto.js';

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;
}
