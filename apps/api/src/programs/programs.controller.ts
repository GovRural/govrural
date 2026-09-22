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
import { CreateProgramDto } from './dto/create-program.dto.js';
import { ListProgramsQueryDto } from './dto/list-programs-query.dto.js';
import { UpdateProgramDto } from './dto/update-program.dto.js';
import { ProgramsService } from './programs.service.js';

const MANAGE_ROLES = [UserRole.SUPER_ADMIN, UserRole.MUNICIPAL_ADMIN] as const;

@Controller('programs')
@UseGuards(TenantGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  @Roles(...MANAGE_ROLES)
  create(@TenantId() municipalityId: string, @Body() dto: CreateProgramDto) {
    return this.programsService.create(municipalityId, dto);
  }

  @Get()
  findAll(
    @TenantId() municipalityId: string,
    @Query() query: ListProgramsQueryDto,
  ) {
    return this.programsService.findAll(municipalityId, query);
  }

  @Get(':id')
  findOne(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.programsService.findOne(municipalityId, id);
  }

  @Patch(':id')
  @Roles(...MANAGE_ROLES)
  update(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgramDto,
  ) {
    return this.programsService.update(municipalityId, id, dto);
  }

  @Delete(':id')
  @Roles(...MANAGE_ROLES)
  remove(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.programsService.remove(municipalityId, id);
  }
}
