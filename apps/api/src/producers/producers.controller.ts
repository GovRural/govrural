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
import { CreateProducerDto } from './dto/create-producer.dto.js';
import { ListProducersQueryDto } from './dto/list-producers-query.dto.js';
import { UpdateProducerDto } from './dto/update-producer.dto.js';
import { ProducersService } from './producers.service.js';

const MANAGE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.MUNICIPAL_ADMIN,
  UserRole.TECHNICIAN,
] as const;

@Controller('producers')
@UseGuards(TenantGuard)
export class ProducersController {
  constructor(private readonly producersService: ProducersService) {}

  @Post()
  @Roles(...MANAGE_ROLES)
  create(
    @TenantId() municipalityId: string,
    @Body() dto: CreateProducerDto,
  ) {
    return this.producersService.create(municipalityId, dto);
  }

  @Get()
  findAll(
    @TenantId() municipalityId: string,
    @Query() query: ListProducersQueryDto,
  ) {
    return this.producersService.findAll(municipalityId, query);
  }

  @Get(':id')
  findOne(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.producersService.findOne(municipalityId, id);
  }

  @Patch(':id')
  @Roles(...MANAGE_ROLES)
  update(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProducerDto,
  ) {
    return this.producersService.update(municipalityId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MUNICIPAL_ADMIN)
  remove(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.producersService.remove(municipalityId, id);
  }
}
