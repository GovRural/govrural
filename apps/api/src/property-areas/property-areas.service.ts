import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { PropertiesService } from '../properties/properties.service.js';
import { CreatePropertyAreaDto } from './dto/create-property-area.dto.js';
import { UpdatePropertyAreaDto } from './dto/update-property-area.dto.js';

@Injectable()
export class PropertyAreasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly propertiesService: PropertiesService,
  ) {}

  async create(
    municipalityId: string,
    propertyId: string,
    dto: CreatePropertyAreaDto,
  ) {
    await this.propertiesService.findOne(municipalityId, propertyId);

    const area = await this.prisma.propertyArea.create({
      data: { ...dto, propertyId },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.CREATE,
      entity: 'PropertyArea',
      entityId: area.id,
      newData: area,
    });

    return area;
  }

  async findAll(municipalityId: string, propertyId: string) {
    await this.propertiesService.findOne(municipalityId, propertyId);

    return this.prisma.propertyArea.findMany({
      where: { propertyId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(municipalityId: string, propertyId: string, id: string) {
    await this.propertiesService.findOne(municipalityId, propertyId);

    const area = await this.prisma.propertyArea.findFirst({
      where: { id, propertyId, deletedAt: null },
    });

    if (!area) {
      throw new NotFoundException('Area/talhao nao encontrado');
    }

    return area;
  }

  async update(
    municipalityId: string,
    propertyId: string,
    id: string,
    dto: UpdatePropertyAreaDto,
  ) {
    const existing = await this.findOne(municipalityId, propertyId, id);

    const area = await this.prisma.propertyArea.update({
      where: { id: existing.id },
      data: dto,
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.UPDATE,
      entity: 'PropertyArea',
      entityId: area.id,
      oldData: existing,
      newData: area,
    });

    return area;
  }

  async remove(municipalityId: string, propertyId: string, id: string) {
    const existing = await this.findOne(municipalityId, propertyId, id);

    if (existing.deletedAt) {
      throw new ConflictException('Area/talhao ja foi removido');
    }

    const area = await this.prisma.propertyArea.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.DELETE,
      entity: 'PropertyArea',
      entityId: area.id,
      oldData: existing,
    });

    return area;
  }
}
