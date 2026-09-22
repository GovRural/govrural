import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { ProducerStatus } from '@prisma/client';
import { CreateProducerDto } from './create-producer.dto.js';

export class UpdateProducerDto extends PartialType(CreateProducerDto) {
  @IsOptional()
  @IsEnum(ProducerStatus)
  status?: ProducerStatus;
}
