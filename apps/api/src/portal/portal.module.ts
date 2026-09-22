import { Module } from '@nestjs/common';
import { ServiceRequestsModule } from '../service-requests/service-requests.module.js';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { PortalController } from './portal.controller.js';
import { PortalService } from './portal.service.js';

@Module({
  imports: [ServiceRequestsModule],
  controllers: [PortalController],
  providers: [PortalService, TenantGuard],
})
export class PortalModule {}
