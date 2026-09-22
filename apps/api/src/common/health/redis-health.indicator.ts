import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { Redis } from 'ioredis';

@Injectable()
export class RedisHealthIndicator {
  constructor(private readonly healthIndicatorService: HealthIndicatorService) {}

  pingCheck(key: string, redisUrl: string) {
    return this.healthIndicatorService
      .check(key)
      .attempt(async () => {
        const client = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
        try {
          await client.connect();
          await client.ping();
        } finally {
          client.disconnect();
        }
      })
      .withTimeout(1500);
  }
}
