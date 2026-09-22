import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { LinkProducerDto } from './dto/link-producer.dto.js';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(municipalityId: string, dto: CreatePropertyDto) {
    const property = await this.prisma.ruralProperty.create({
      data: { ...dto, municipalityId },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.CREATE,
      entity: 'RuralProperty',
      entityId: property.id,
      newData: property,
    });

    return property;
  }

  async findAll(municipalityId: string, query: ListPropertiesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.RuralPropertyWhereInput = {
      municipalityId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              {
                registrationNumber: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              { locality: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.ruralProperty.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ruralProperty.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(municipalityId: string, id: string) {
    const property = await this.prisma.ruralProperty.findFirst({
      where: { id, municipalityId, deletedAt: null },
      include: {
        producerLinks: {
          where: { endDate: null },
          include: { producer: true },
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Propriedade nao encontrada');
    }

    return property;
  }

  async update(municipalityId: string, id: string, dto: UpdatePropertyDto) {
    const existing = await this.findOne(municipalityId, id);

    const property = await this.prisma.ruralProperty.update({
      where: { id: existing.id },
      data: dto,
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.UPDATE,
      entity: 'RuralProperty',
      entityId: property.id,
      oldData: existing,
      newData: property,
    });

    return property;
  }

  async remove(municipalityId: string, id: string) {
    const existing = await this.findOne(municipalityId, id);

    if (existing.deletedAt) {
      throw new ConflictException('Propriedade ja foi removida');
    }

    const property = await this.prisma.ruralProperty.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.DELETE,
      entity: 'RuralProperty',
      entityId: property.id,
      oldData: existing,
    });

    return property;
  }

  async linkProducer(
    municipalityId: string,
    propertyId: string,
    dto: LinkProducerDto,
  ) {
    await this.findOne(municipalityId, propertyId);

    const producer = await this.prisma.producer.findFirst({
      where: { id: dto.producerId, municipalityId, deletedAt: null },
    });

    if (!producer) {
      throw new BadRequestException('Produtor invalido para este municipio');
    }

    const link = await this.prisma.producerProperty.create({
      data: {
        propertyId,
        producerId: dto.producerId,
        relationshipType: dto.relationshipType,
        percentage: dto.percentage,
        isPrimary: dto.isPrimary ?? false,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
      },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.CREATE,
      entity: 'ProducerProperty',
      entityId: link.id,
      newData: link,
    });

    return link;
  }

  async listProducers(municipalityId: string, propertyId: string) {
    await this.findOne(municipalityId, propertyId);

    return this.prisma.producerProperty.findMany({
      where: { propertyId, endDate: null },
      include: { producer: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async unlinkProducer(
    municipalityId: string,
    propertyId: string,
    linkId: string,
  ) {
    await this.findOne(municipalityId, propertyId);

    const link = await this.prisma.producerProperty.findFirst({
      where: { id: linkId, propertyId, endDate: null },
    });

    if (!link) {
      throw new NotFoundException('Vinculo nao encontrado ou ja encerrado');
    }

    const updated = await this.prisma.producerProperty.update({
      where: { id: link.id },
      data: { endDate: new Date() },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.UPDATE,
      entity: 'ProducerProperty',
      entityId: updated.id,
      oldData: link,
      newData: updated,
    });

    return updated;
  }
}
