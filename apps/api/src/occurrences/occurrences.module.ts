import { Module } from '@nestjs/common';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { OccurrencesController } from './occurrences.controller.js';
import { OccurrencesService } from './occurrences.service.js';

@Module({
  controllers: [OccurrencesController],
  providers: [OccurrencesService, TenantGuard],
})
export class OccurrencesModule {}
