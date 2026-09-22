import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { MunicipalityStatus } from '@prisma/client';
import { CreateMunicipalityDto } from './create-municipality.dto.js';

export class UpdateMunicipalityDto extends PartialType(CreateMunicipalityDto) {
  @IsOptional()
  @IsEnum(MunicipalityStatus)
  status?: MunicipalityStatus;
}
