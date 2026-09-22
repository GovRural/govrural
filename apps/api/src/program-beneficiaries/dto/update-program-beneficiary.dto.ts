import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { ProgramBeneficiaryStatus } from '@prisma/client';
import { CreateProgramBeneficiaryDto } from './create-program-beneficiary.dto.js';

export class UpdateProgramBeneficiaryDto extends PartialType(
  CreateProgramBeneficiaryDto,
) {
  @IsOptional()
  @IsEnum(ProgramBeneficiaryStatus)
  status?: ProgramBeneficiaryStatus;
}
