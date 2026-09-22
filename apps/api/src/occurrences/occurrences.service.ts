import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, OccurrenceStatus, Prisma } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateOccurrenceDto } from './dto/create-occurrence.dto.js';
import { ListOccurrencesQueryDto } from './dto/list-occurrences-query.dto.js';
import { UpdateOccurrenceDto } from './dto/update-occurrence.dto.js';

@Injectable()
export class OccurrencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    municipalityId: string,
    reporterUserId: string,
    dto: CreateOccurrenceDto,
  ) {
    if (dto.departmentId) {
      await this.assertDepartmentBelongs(dto.departmentId, municipalityId);
    }

    const occurrence = await this.prisma.ruralOccurrence.create({
      data: { ...dto, municipalityId, reporterUserId },
    });

    await this.audit.log({
      municipalityId,
      userId: reporterUserId,
      action: AuditAction.CREATE,
      entity: 'RuralOccurrence',
      entityId: occurrence.id,
      newData: occurrence,
    });

    return occurrence;
  }

  async findAll(municipalityId: string, query: ListOccurrencesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.RuralOccurrenceWhereInput = {
      municipalityId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.ruralOccurrence.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ruralOccurrence.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(municipalityId: string, id: string) {
    const occurrence = await this.prisma.ruralOccurrence.findFirst({
      where: { id, municipalityId },
      include: {
        reporterUser: { select: { id: true, name: true } },
        department: true,
      },
    });

    if (!occurrence) {
      throw new NotFoundException('Ocorrencia nao encontrada');
    }

    return occurrence;
  }

  async update(
    municipalityId: string,
    id: string,
    userId: string,
    dto: UpdateOccurrenceDto,
  ) {
    const existing = await this.findOne(municipalityId, id);

    if (dto.departmentId) {
      await this.assertDepartmentBelongs(dto.departmentId, municipalityId);
    }

    let resolvedAt = existing.resolvedAt;
    if (dto.status) {
      if (dto.status === OccurrenceStatus.RESOLVED && existing.status !== OccurrenceStatus.RESOLVED) {
        resolvedAt = new Date();
      } else if (dto.status !== OccurrenceStatus.RESOLVED && existing.status === OccurrenceStatus.RESOLVED) {
        resolvedAt = null;
      }
    }

    const occurrence = await this.prisma.ruralOccurrence.update({
      where: { id: existing.id },
      data: { ...dto, resolvedAt },
    });

    await this.audit.log({
      municipalityId,
      userId,
      action: AuditAction.UPDATE,
      entity: 'RuralOccurrence',
      entityId: occurrence.id,
      oldData: existing,
      newData: occurrence,
    });

    return occurrence;
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
