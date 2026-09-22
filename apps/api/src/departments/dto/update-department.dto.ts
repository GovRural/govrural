import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { DepartmentStatus } from '@prisma/client';
import { CreateDepartmentDto } from './create-department.dto.js';

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {
  @IsOptional()
  @IsEnum(DepartmentStatus)
  status?: DepartmentStatus;
}
