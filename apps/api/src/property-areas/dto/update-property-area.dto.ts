import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { PropertyAreaStatus } from '@prisma/client';
import { CreatePropertyAreaDto } from './create-property-area.dto.js';

export class UpdatePropertyAreaDto extends PartialType(CreatePropertyAreaDto) {
  @IsOptional()
  @IsEnum(PropertyAreaStatus)
  status?: PropertyAreaStatus;
}
