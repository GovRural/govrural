import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateProducerDto } from './dto/create-producer.dto.js';
import { ListProducersQueryDto } from './dto/list-producers-query.dto.js';
import { UpdateProducerDto } from './dto/update-producer.dto.js';

@Injectable()
export class ProducersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(municipalityId: string, dto: CreateProducerDto) {
    try {
      const producer = await this.prisma.producer.create({
        data: { ...dto, municipalityId },
      });

      await this.audit.log({
        municipalityId,
        action: AuditAction.CREATE,
        entity: 'Producer',
        entityId: producer.id,
        newData: producer,
      });

      return producer;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ja existe um produtor com este CPF/CNPJ neste municipio',
        );
      }
      throw error;
    }
  }

  async findAll(municipalityId: string, query: ListProducersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ProducerWhereInput = {
      municipalityId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { cpfCnpj: { contains: query.search.replace(/\D/g, '') } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.producer.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.producer.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(municipalityId: string, id: string) {
    const producer = await this.prisma.producer.findFirst({
      where: { id, municipalityId, deletedAt: null },
    });

    if (!producer) {
      throw new NotFoundException('Produtor nao encontrado');
    }

    return producer;
  }

  async update(municipalityId: string, id: string, dto: UpdateProducerDto) {
    const existing = await this.findOne(municipalityId, id);

    try {
      const producer = await this.prisma.producer.update({
        where: { id: existing.id },
        data: dto,
      });

      await this.audit.log({
        municipalityId,
        action: AuditAction.UPDATE,
        entity: 'Producer',
        entityId: producer.id,
        oldData: existing,
        newData: producer,
      });

      return producer;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ja existe um produtor com este CPF/CNPJ neste municipio',
        );
      }
      throw error;
    }
  }

  async remove(municipalityId: string, id: string) {
    const existing = await this.findOne(municipalityId, id);

    if (existing.deletedAt) {
      throw new ConflictException('Produtor ja foi removido');
    }

    const producer = await this.prisma.producer.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.DELETE,
      entity: 'Producer',
      entityId: producer.id,
      oldData: existing,
    });

    return producer;
  }
}
