import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateMachineDto } from './dto/create-machine.dto.js';
import { ListMachinesQueryDto } from './dto/list-machines-query.dto.js';
import { UpdateMachineDto } from './dto/update-machine.dto.js';

@Injectable()
export class MachinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(municipalityId: string, dto: CreateMachineDto) {
    const machine = await this.prisma.machine.create({
      data: { ...dto, municipalityId },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.CREATE,
      entity: 'Machine',
      entityId: machine.id,
      newData: machine,
    });

    return machine;
  }

  async findAll(municipalityId: string, query: ListMachinesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.MachineWhereInput = {
      municipalityId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { plate: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.machine.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.machine.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(municipalityId: string, id: string) {
    const machine = await this.prisma.machine.findFirst({
      where: { id, municipalityId, deletedAt: null },
    });

    if (!machine) {
      throw new NotFoundException('Maquina nao encontrada');
    }

    return machine;
  }

  async update(municipalityId: string, id: string, dto: UpdateMachineDto) {
    const existing = await this.findOne(municipalityId, id);

    const machine = await this.prisma.machine.update({
      where: { id: existing.id },
      data: dto,
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.UPDATE,
      entity: 'Machine',
      entityId: machine.id,
      oldData: existing,
      newData: machine,
    });

    return machine;
  }

  async remove(municipalityId: string, id: string) {
    const existing = await this.findOne(municipalityId, id);

    if (existing.deletedAt) {
      throw new ConflictException('Maquina ja foi removida');
    }

    const machine = await this.prisma.machine.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.DELETE,
      entity: 'Machine',
      entityId: machine.id,
      oldData: existing,
    });

    return machine;
  }
}
