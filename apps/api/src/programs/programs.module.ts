import { Module } from '@nestjs/common';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { ProgramsController } from './programs.controller.js';
import { ProgramsService } from './programs.service.js';

@Module({
  controllers: [ProgramsController],
  providers: [ProgramsService, TenantGuard],
  exports: [ProgramsService],
})
export class ProgramsModule {}
