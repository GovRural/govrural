import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateServiceTypeDto } from './dto/create-service-type.dto.js';
import { UpdateServiceTypeDto } from './dto/update-service-type.dto.js';

@Injectable()
export class ServiceTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(municipalityId: string, dto: CreateServiceTypeDto) {
    if (dto.departmentId) {
      await this.assertDepartmentBelongs(dto.departmentId, municipalityId);
    }

    const serviceType = await this.prisma.serviceType.create({
      data: { ...dto, municipalityId },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.CREATE,
      entity: 'ServiceType',
      entityId: serviceType.id,
      newData: serviceType,
    });

    return serviceType;
  }

  findAll(municipalityId: string) {
    return this.prisma.serviceType.findMany({
      where: { municipalityId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(municipalityId: string, id: string) {
    const serviceType = await this.prisma.serviceType.findFirst({
      where: { id, municipalityId, deletedAt: null },
    });

    if (!serviceType) {
      throw new NotFoundException('Tipo de servico nao encontrado');
    }

    return serviceType;
  }

  async update(municipalityId: string, id: string, dto: UpdateServiceTypeDto) {
    const existing = await this.findOne(municipalityId, id);

    if (dto.departmentId) {
      await this.assertDepartmentBelongs(dto.departmentId, municipalityId);
    }

    const serviceType = await this.prisma.serviceType.update({
      where: { id: existing.id },
      data: dto,
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.UPDATE,
      entity: 'ServiceType',
      entityId: serviceType.id,
      oldData: existing,
      newData: serviceType,
    });

    return serviceType;
  }

  async remove(municipalityId: string, id: string) {
    const existing = await this.findOne(municipalityId, id);

    if (existing.deletedAt) {
      throw new ConflictException('Tipo de servico ja foi removido');
    }

    const serviceType = await this.prisma.serviceType.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.DELETE,
      entity: 'ServiceType',
      entityId: serviceType.id,
      oldData: existing,
    });

    return serviceType;
  }

  private async assertDepartmentBelongs(
    departmentId: string,
    municipalityId: string,
  ) {
    const department = await this.prisma.department.findFirst({
      where: { id: departmentId, municipalityId },
    });

    if (!department) {
      throw new BadRequestException('Secretaria invalida para este municipio');
    }
  }
}
