import { Module } from '@nestjs/common';
import { ProgramsModule } from '../programs/programs.module.js';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { ProgramBeneficiariesController } from './program-beneficiaries.controller.js';
import { ProgramBeneficiariesService } from './program-beneficiaries.service.js';

@Module({
  imports: [ProgramsModule],
  controllers: [ProgramBeneficiariesController],
  providers: [ProgramBeneficiariesService, TenantGuard],
})
export class ProgramBeneficiariesModule {}
