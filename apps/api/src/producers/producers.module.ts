import { Module } from '@nestjs/common';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { ProducersController } from './producers.controller.js';
import { ProducersService } from './producers.service.js';

@Module({
  controllers: [ProducersController],
  providers: [ProducersService, TenantGuard],
  exports: [ProducersService],
})
export class ProducersModule {}
