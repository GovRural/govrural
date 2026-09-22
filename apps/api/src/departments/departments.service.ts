import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(municipalityId: string, dto: CreateDepartmentDto) {
    const department = await this.prisma.department.create({
      data: { ...dto, municipalityId },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.CREATE,
      entity: 'Department',
      entityId: department.id,
      newData: department,
    });

    return department;
  }

  findAll(municipalityId: string) {
    return this.prisma.department.findMany({
      where: { municipalityId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(municipalityId: string, id: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, municipalityId, deletedAt: null },
    });

    if (!department) {
      throw new NotFoundException('Secretaria nao encontrada');
    }

    return department;
  }

  async update(municipalityId: string, id: string, dto: UpdateDepartmentDto) {
    const existing = await this.findOne(municipalityId, id);

    const department = await this.prisma.department.update({
      where: { id: existing.id },
      data: dto,
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.UPDATE,
      entity: 'Department',
      entityId: department.id,
      oldData: existing,
      newData: department,
    });

    return department;
  }

  async remove(municipalityId: string, id: string) {
    const existing = await this.findOne(municipalityId, id);

    if (existing.deletedAt) {
      throw new ConflictException('Secretaria ja foi removida');
    }

    const department = await this.prisma.department.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.DELETE,
      entity: 'Department',
      entityId: department.id,
      oldData: existing,
    });

    return department;
  }
}
