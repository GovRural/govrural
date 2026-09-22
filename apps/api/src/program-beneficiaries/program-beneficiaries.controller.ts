import {
  Body,
  Controller,
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
import { CreateProgramBeneficiaryDto } from './dto/create-program-beneficiary.dto.js';
import { UpdateProgramBeneficiaryDto } from './dto/update-program-beneficiary.dto.js';
import { ProgramBeneficiariesService } from './program-beneficiaries.service.js';

const MANAGE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.MUNICIPAL_ADMIN,
  UserRole.SECRETARY,
  UserRole.TECHNICIAN,
] as const;

@Controller('programs/:programId/beneficiaries')
@UseGuards(TenantGuard)
export class ProgramBeneficiariesController {
  constructor(
    private readonly programBeneficiariesService: ProgramBeneficiariesService,
  ) {}

  @Post()
  @Roles(...MANAGE_ROLES)
  create(
    @TenantId() municipalityId: string,
    @Param('programId', ParseUUIDPipe) programId: string,
    @Body() dto: CreateProgramBeneficiaryDto,
  ) {
    return this.programBeneficiariesService.create(
      municipalityId,
      programId,
      dto,
    );
  }

  @Get()
  findAll(
    @TenantId() municipalityId: string,
    @Param('programId', ParseUUIDPipe) programId: string,
  ) {
    return this.programBeneficiariesService.findAll(municipalityId, programId);
  }

  @Get(':id')
  findOne(
    @TenantId() municipalityId: string,
    @Param('programId', ParseUUIDPipe) programId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.programBeneficiariesService.findOne(
      municipalityId,
      programId,
      id,
    );
  }

  @Patch(':id')
  @Roles(...MANAGE_ROLES)
  update(
    @TenantId() municipalityId: string,
    @Param('programId', ParseUUIDPipe) programId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgramBeneficiaryDto,
  ) {
    return this.programBeneficiariesService.update(
      municipalityId,
      programId,
      id,
      dto,
    );
  }
}
