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
import { ChangeServiceRequestStatusDto } from './dto/change-status.dto.js';
import { CreateServiceRequestDto } from './dto/create-service-request.dto.js';
import { ListServiceRequestsQueryDto } from './dto/list-service-requests-query.dto.js';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto.js';
import { ServiceRequestsService } from './service-requests.service.js';

const MANAGE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.MUNICIPAL_ADMIN,
  UserRole.SECRETARY,
  UserRole.TECHNICIAN,
] as const;

@Controller('service-requests')
@UseGuards(TenantGuard)
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Post()
  @Roles(...MANAGE_ROLES)
  create(
    @TenantId() municipalityId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateServiceRequestDto,
  ) {
    return this.serviceRequestsService.create(
      municipalityId,
      currentUser.id,
      dto,
    );
  }

  @Get()
  findAll(
    @TenantId() municipalityId: string,
    @Query() query: ListServiceRequestsQueryDto,
  ) {
    return this.serviceRequestsService.findAll(municipalityId, query);
  }

  @Get(':id')
  findOne(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.serviceRequestsService.findOne(municipalityId, id);
  }

  @Get(':id/history')
  findHistory(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.serviceRequestsService.findHistory(municipalityId, id);
  }

  @Patch(':id')
  @Roles(...MANAGE_ROLES)
  update(
    @TenantId() municipalityId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceRequestDto,
  ) {
    return this.serviceRequestsService.update(
      municipalityId,
      id,
      currentUser.id,
      dto,
    );
  }

  @Patch(':id/status')
  @Roles(...MANAGE_ROLES)
  changeStatus(
    @TenantId() municipalityId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeServiceRequestStatusDto,
  ) {
    return this.serviceRequestsService.changeStatus(
      municipalityId,
      id,
      currentUser.id,
      dto,
    );
  }
}
