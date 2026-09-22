import { Module } from '@nestjs/common';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { ServiceTypesController } from './service-types.controller.js';
import { ServiceTypesService } from './service-types.service.js';

@Module({
  controllers: [ServiceTypesController],
  providers: [ServiceTypesService, TenantGuard],
})
export class ServiceTypesModule {}
