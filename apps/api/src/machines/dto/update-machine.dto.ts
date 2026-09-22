import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { MachineStatus } from '@prisma/client';
import { CreateMachineDto } from './create-machine.dto.js';

export class UpdateMachineDto extends PartialType(CreateMachineDto) {
  @IsOptional()
  @IsEnum(MachineStatus)
  status?: MachineStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentHourMeter?: number;
}
