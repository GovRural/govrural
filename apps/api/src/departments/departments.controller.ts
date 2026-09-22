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
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import { DepartmentsService } from './departments.service.js';

// RolesGuard e global (ver app.module.ts). TenantGuard precisa ser aplicado
// aqui porque so os controllers de recursos de tenant o utilizam.
@Controller('departments')
@UseGuards(TenantGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MUNICIPAL_ADMIN)
  create(@TenantId() municipalityId: string, @Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(municipalityId, dto);
  }

  @Get()
  findAll(@TenantId() municipalityId: string) {
    return this.departmentsService.findAll(municipalityId);
  }

  @Get(':id')
  findOne(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.departmentsService.findOne(municipalityId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MUNICIPAL_ADMIN)
  update(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(municipalityId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MUNICIPAL_ADMIN)
  remove(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.departmentsService.remove(municipalityId, id);
  }
}
