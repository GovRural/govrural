import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { TenantId } from '../common/tenant/tenant-id.decorator.js';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { CreateMachineServiceDto } from './dto/create-machine-service.dto.js';
import { ExecuteMachineServiceDto } from './dto/execute-machine-service.dto.js';
import { ListMachineServicesQueryDto } from './dto/list-machine-services-query.dto.js';
import { UpdateMachineServiceDto } from './dto/update-machine-service.dto.js';
import { MachineServicesService } from './machine-services.service.js';

const SCHEDULE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.MUNICIPAL_ADMIN,
  UserRole.SECRETARY,
  UserRole.TECHNICIAN,
] as const;

const EXECUTE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.MUNICIPAL_ADMIN,
  UserRole.TECHNICIAN,
  UserRole.MACHINE_OPERATOR,
] as const;

@Controller('machine-services')
@UseGuards(TenantGuard)
export class MachineServicesController {
  constructor(
    private readonly machineServicesService: MachineServicesService,
  ) {}

  @Post()
  @Roles(...SCHEDULE_ROLES)
  create(
    @TenantId() municipalityId: string,
    @Body() dto: CreateMachineServiceDto,
  ) {
    return this.machineServicesService.create(municipalityId, dto);
  }

  @Get()
  findAll(
    @TenantId() municipalityId: string,
    @Query() query: ListMachineServicesQueryDto,
  ) {
    return this.machineServicesService.findAll(municipalityId, query);
  }

  @Get(':id')
  findOne(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.machineServicesService.findOne(municipalityId, id);
  }

  @Patch(':id')
  @Roles(...SCHEDULE_ROLES)
  update(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMachineServiceDto,
  ) {
    return this.machineServicesService.update(municipalityId, id, dto);
  }

  @Patch(':id/execution')
  @Roles(...EXECUTE_ROLES)
  execute(
    @TenantId() municipalityId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExecuteMachineServiceDto,
  ) {
    return this.machineServicesService.execute(
      municipalityId,
      id,
      currentUser.id,
      dto,
    );
  }
}
