import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { TenantId } from '../common/tenant/tenant-id.decorator.js';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { CreatePropertyAreaDto } from './dto/create-property-area.dto.js';
import { UpdatePropertyAreaDto } from './dto/update-property-area.dto.js';
import { PropertyAreasService } from './property-areas.service.js';

const MANAGE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.MUNICIPAL_ADMIN,
  UserRole.TECHNICIAN,
] as const;

@Controller('properties/:propertyId/areas')
@UseGuards(TenantGuard)
export class PropertyAreasController {
  constructor(private readonly propertyAreasService: PropertyAreasService) {}

  @Post()
  @Roles(...MANAGE_ROLES)
  create(
    @TenantId() municipalityId: string,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() dto: CreatePropertyAreaDto,
  ) {
    return this.propertyAreasService.create(municipalityId, propertyId, dto);
  }

  @Get()
  findAll(
    @TenantId() municipalityId: string,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
  ) {
    return this.propertyAreasService.findAll(municipalityId, propertyId);
  }

  @Get(':id')
  findOne(
    @TenantId() municipalityId: string,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.propertyAreasService.findOne(municipalityId, propertyId, id);
  }

  @Patch(':id')
  @Roles(...MANAGE_ROLES)
  update(
    @TenantId() municipalityId: string,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyAreaDto,
  ) {
    return this.propertyAreasService.update(
      municipalityId,
      propertyId,
      id,
      dto,
    );
  }

  @Delete(':id')
  @Roles(...MANAGE_ROLES)
  remove(
    @TenantId() municipalityId: string,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.propertyAreasService.remove(municipalityId, propertyId, id);
  }
}
