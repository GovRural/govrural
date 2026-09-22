import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { ProgramStatus } from '@prisma/client';
import { CreateProgramDto } from './create-program.dto.js';

export class UpdateProgramDto extends PartialType(CreateProgramDto) {
  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;
}
