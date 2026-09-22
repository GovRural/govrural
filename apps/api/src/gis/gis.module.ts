import { Module } from '@nestjs/common';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { GisController } from './gis.controller.js';
import { GisService } from './gis.service.js';

@Module({
  controllers: [GisController],
  providers: [GisService, TenantGuard],
})
export class GisModule {}
