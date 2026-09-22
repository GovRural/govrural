import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { OccurrenceStatus } from '@prisma/client';
import { CreateOccurrenceDto } from './create-occurrence.dto.js';

export class UpdateOccurrenceDto extends PartialType(CreateOccurrenceDto) {
  @IsOptional()
  @IsEnum(OccurrenceStatus)
  status?: OccurrenceStatus;
}
