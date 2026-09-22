import { Module } from '@nestjs/common';
import { PropertiesModule } from '../properties/properties.module.js';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { PropertyAreasController } from './property-areas.controller.js';
import { PropertyAreasService } from './property-areas.service.js';

@Module({
  imports: [PropertiesModule],
  controllers: [PropertyAreasController],
  providers: [PropertyAreasService, TenantGuard],
})
export class PropertyAreasModule {}
