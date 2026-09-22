import { Controller, Get, UseGuards } from '@nestjs/common';
import { TenantId } from '../common/tenant/tenant-id.decorator.js';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { DashboardsService } from './dashboards.service.js';

@Controller('dashboard')
@UseGuards(TenantGuard)
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('summary')
  getSummary(@TenantId() municipalityId: string) {
    return this.dashboardsService.getSummary(municipalityId);
  }

  @Get('service-requests')
  getServiceRequestMetrics(@TenantId() municipalityId: string) {
    return this.dashboardsService.getServiceRequestMetrics(municipalityId);
  }

  @Get('machines')
  getMachinesMetrics(@TenantId() municipalityId: string) {
    return this.dashboardsService.getMachinesMetrics(municipalityId);
  }

  @Get('programs')
  getProgramsMetrics(@TenantId() municipalityId: string) {
    return this.dashboardsService.getProgramsMetrics(municipalityId);
  }

  @Get('occurrences')
  getOccurrencesMetrics(@TenantId() municipalityId: string) {
    return this.dashboardsService.getOccurrencesMetrics(municipalityId);
  }
}
