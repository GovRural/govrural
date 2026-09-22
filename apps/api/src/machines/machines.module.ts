import { Module } from '@nestjs/common';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { MachinesController } from './machines.controller.js';
import { MachinesService } from './machines.service.js';

@Module({
  controllers: [MachinesController],
  providers: [MachinesService, TenantGuard],
  exports: [MachinesService],
})
export class MachinesModule {}
