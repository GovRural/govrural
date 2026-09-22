import { Module } from '@nestjs/common';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { DashboardsController } from './dashboards.controller.js';
import { DashboardsService } from './dashboards.service.js';

@Module({
  controllers: [DashboardsController],
  providers: [DashboardsService, TenantGuard],
})
export class DashboardsModule {}
