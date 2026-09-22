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
import { CreateOccurrenceDto } from './dto/create-occurrence.dto.js';
import { ListOccurrencesQueryDto } from './dto/list-occurrences-query.dto.js';
import { UpdateOccurrenceDto } from './dto/update-occurrence.dto.js';
import { OccurrencesService } from './occurrences.service.js';

const REPORT_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.MUNICIPAL_ADMIN,
  UserRole.SECRETARY,
  UserRole.TECHNICIAN,
  UserRole.MACHINE_OPERATOR,
] as const;

const MANAGE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.MUNICIPAL_ADMIN,
  UserRole.SECRETARY,
  UserRole.TECHNICIAN,
] as const;

@Controller('occurrences')
@UseGuards(TenantGuard)
export class OccurrencesController {
  constructor(private readonly occurrencesService: OccurrencesService) {}

  @Post()
  @Roles(...REPORT_ROLES)
  create(
    @TenantId() municipalityId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateOccurrenceDto,
  ) {
    return this.occurrencesService.create(municipalityId, currentUser.id, dto);
  }

  @Get()
  findAll(
    @TenantId() municipalityId: string,
    @Query() query: ListOccurrencesQueryDto,
  ) {
    return this.occurrencesService.findAll(municipalityId, query);
  }

  @Get(':id')
  findOne(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.occurrencesService.findOne(municipalityId, id);
  }

  @Patch(':id')
  @Roles(...MANAGE_ROLES)
  update(
    @TenantId() municipalityId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOccurrenceDto,
  ) {
    return this.occurrencesService.update(
      municipalityId,
      id,
      currentUser.id,
      dto,
    );
  }
}
