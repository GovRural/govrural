import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { Public } from '../../auth/decorators/public.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisHealthIndicator } from './redis-health.indicator.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    const redisUrl = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.redisHealth.pingCheck('redis', redisUrl),
    ]);
  }
}
