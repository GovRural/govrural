import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { TenantId } from '../common/tenant/tenant-id.decorator.js';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { LinkProducerDto } from './dto/link-producer.dto.js';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { PropertiesService } from './properties.service.js';

const MANAGE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.MUNICIPAL_ADMIN,
  UserRole.TECHNICIAN,
] as const;

@Controller('properties')
@UseGuards(TenantGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @Roles(...MANAGE_ROLES)
  create(@TenantId() municipalityId: string, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(municipalityId, dto);
  }

  @Get()
  findAll(
    @TenantId() municipalityId: string,
    @Query() query: ListPropertiesQueryDto,
  ) {
    return this.propertiesService.findAll(municipalityId, query);
  }

  @Get(':id')
  findOne(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.propertiesService.findOne(municipalityId, id);
  }

  @Patch(':id')
  @Roles(...MANAGE_ROLES)
  update(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(municipalityId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MUNICIPAL_ADMIN)
  remove(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.propertiesService.remove(municipalityId, id);
  }

  @Post(':id/producers')
  @Roles(...MANAGE_ROLES)
  linkProducer(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkProducerDto,
  ) {
    return this.propertiesService.linkProducer(municipalityId, id, dto);
  }

  @Get(':id/producers')
  listProducers(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.propertiesService.listProducers(municipalityId, id);
  }

  @Delete(':id/producers/:linkId')
  @Roles(...MANAGE_ROLES)
  unlinkProducer(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
  ) {
    return this.propertiesService.unlinkProducer(municipalityId, id, linkId);
  }
}
