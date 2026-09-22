import { Module } from '@nestjs/common';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { MachineServicesController } from './machine-services.controller.js';
import { MachineServicesService } from './machine-services.service.js';

@Module({
  controllers: [MachineServicesController],
  providers: [MachineServicesService, TenantGuard],
})
export class MachineServicesModule {}
