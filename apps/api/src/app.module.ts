import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import { AuditModule } from './common/audit/audit.module.js';
import { HealthModule } from './common/health/health.module.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { DepartmentsModule } from './departments/departments.module.js';
import { MachineServicesModule } from './machine-services/machine-services.module.js';
import { MachinesModule } from './machines/machines.module.js';
import { MunicipalitiesModule } from './municipalities/municipalities.module.js';
import { OccurrencesModule } from './occurrences/occurrences.module.js';
import { ProducersModule } from './producers/producers.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { PropertyAreasModule } from './property-areas/property-areas.module.js';
import { ServiceRequestsModule } from './service-requests/service-requests.module.js';
import { ServiceTypesModule } from './service-types/service-types.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuditModule,
    HealthModule,
    AuthModule,
    UsersModule,
    MunicipalitiesModule,
    DepartmentsModule,
    ProducersModule,
    PropertiesModule,
    PropertyAreasModule,
    ServiceTypesModule,
    ServiceRequestsModule,
    OccurrencesModule,
    MachinesModule,
    MachineServicesModule,
  ],
  providers: [
    // Ordem importa: JwtAuthGuard popula request.user antes do RolesGuard
    // avaliar @Roles(). Guards globais rodam antes de guards de controller
    // (ex: TenantGuard em DepartmentsController).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
