import { Module } from '@nestjs/common';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { PropertiesController } from './properties.controller.js';
import { PropertiesService } from './properties.service.js';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService, TenantGuard],
  exports: [PropertiesService],
})
export class PropertiesModule {}
