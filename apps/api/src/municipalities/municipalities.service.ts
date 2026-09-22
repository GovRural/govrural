import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateMunicipalityDto } from './dto/create-municipality.dto.js';
import { UpdateMunicipalityDto } from './dto/update-municipality.dto.js';
import { UpdateMunicipalitySettingsDto } from './dto/update-municipality-settings.dto.js';

@Injectable()
export class MunicipalitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateMunicipalityDto) {
    const municipality = await this.prisma.municipality.create({
      data: { ...dto, state: dto.state.toUpperCase() },
    });

    await this.audit.log({
      municipalityId: municipality.id,
      action: AuditAction.CREATE,
      entity: 'Municipality',
      entityId: municipality.id,
      newData: municipality,
    });

    return municipality;
  }

  findAll() {
    return this.prisma.municipality.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const municipality = await this.prisma.municipality.findFirst({
      where: { id, deletedAt: null },
    });

    if (!municipality) {
      throw new NotFoundException('Municipio nao encontrado');
    }

    return municipality;
  }

  async update(id: string, dto: UpdateMunicipalityDto) {
    const existing = await this.findOne(id);

    const municipality = await this.prisma.municipality.update({
      where: { id },
      data: { ...dto, state: dto.state?.toUpperCase() },
    });

    await this.audit.log({
      municipalityId: municipality.id,
      action: AuditAction.UPDATE,
      entity: 'Municipality',
      entityId: municipality.id,
      oldData: existing,
      newData: municipality,
    });

    return municipality;
  }

  async remove(id: string) {
    const existing = await this.findOne(id);

    if (existing.deletedAt) {
      throw new ConflictException('Municipio ja foi removido');
    }

    const municipality = await this.prisma.municipality.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    await this.audit.log({
      municipalityId: municipality.id,
      action: AuditAction.DELETE,
      entity: 'Municipality',
      entityId: municipality.id,
      oldData: existing,
    });

    return municipality;
  }

  async getSettings(municipalityId: string) {
    await this.findOne(municipalityId);

    return this.prisma.municipalitySettings.findUnique({
      where: { municipalityId },
    });
  }

  async upsertSettings(
    municipalityId: string,
    dto: UpdateMunicipalitySettingsDto,
  ) {
    await this.findOne(municipalityId);

    const settings = await this.prisma.municipalitySettings.upsert({
      where: { municipalityId },
      create: { ...dto, municipalityId },
      update: dto,
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.UPDATE,
      entity: 'MunicipalitySettings',
      entityId: settings.id,
      newData: settings,
    });

    return settings;
  }
}
