import { Module } from '@nestjs/common';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { ServiceRequestsController } from './service-requests.controller.js';
import { ServiceRequestsService } from './service-requests.service.js';

@Module({
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService, TenantGuard],
})
export class ServiceRequestsModule {}
