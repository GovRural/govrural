import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import { AuditModule } from './common/audit/audit.module.js';
import { HealthModule } from './common/health/health.module.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { DashboardsModule } from './dashboards/dashboards.module.js';
import { DepartmentsModule } from './departments/departments.module.js';
import { GisModule } from './gis/gis.module.js';
import { MachineServicesModule } from './machine-services/machine-services.module.js';
import { MachinesModule } from './machines/machines.module.js';
import { MunicipalitiesModule } from './municipalities/municipalities.module.js';
import { OccurrencesModule } from './occurrences/occurrences.module.js';
import { ProducersModule } from './producers/producers.module.js';
import { ProgramBeneficiariesModule } from './program-beneficiaries/program-beneficiaries.module.js';
import { ProgramsModule } from './programs/programs.module.js';
import { PortalModule } from './portal/portal.module.js';
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
    // Rate limit geral (ver secao 44). /auth/login tem um limite mais
    // estrito (@Throttle no AuthController) contra brute-force de senha.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
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
    ProgramsModule,
    ProgramBeneficiariesModule,
    GisModule,
    DashboardsModule,
    PortalModule,
  ],
  providers: [
    // Ordem importa: ThrottlerGuard roda primeiro (se aplica ate a rotas
    // publicas, como /auth/login). JwtAuthGuard popula request.user antes
    // do RolesGuard avaliar @Roles(). Guards globais rodam antes de guards
    // de controller (ex: TenantGuard em DepartmentsController).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
