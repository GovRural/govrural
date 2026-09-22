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
import { CreateMachineDto } from './dto/create-machine.dto.js';
import { ListMachinesQueryDto } from './dto/list-machines-query.dto.js';
import { UpdateMachineDto } from './dto/update-machine.dto.js';
import { MachinesService } from './machines.service.js';

const MANAGE_ROLES = [UserRole.SUPER_ADMIN, UserRole.MUNICIPAL_ADMIN] as const;

@Controller('machines')
@UseGuards(TenantGuard)
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Post()
  @Roles(...MANAGE_ROLES)
  create(@TenantId() municipalityId: string, @Body() dto: CreateMachineDto) {
    return this.machinesService.create(municipalityId, dto);
  }

  @Get()
  findAll(
    @TenantId() municipalityId: string,
    @Query() query: ListMachinesQueryDto,
  ) {
    return this.machinesService.findAll(municipalityId, query);
  }

  @Get(':id')
  findOne(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.machinesService.findOne(municipalityId, id);
  }

  @Patch(':id')
  @Roles(...MANAGE_ROLES)
  update(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMachineDto,
  ) {
    return this.machinesService.update(municipalityId, id, dto);
  }

  @Delete(':id')
  @Roles(...MANAGE_ROLES)
  remove(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.machinesService.remove(municipalityId, id);
  }
}
