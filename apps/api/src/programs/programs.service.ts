import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateProgramDto } from './dto/create-program.dto.js';
import { ListProgramsQueryDto } from './dto/list-programs-query.dto.js';
import { UpdateProgramDto } from './dto/update-program.dto.js';

@Injectable()
export class ProgramsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(municipalityId: string, dto: CreateProgramDto) {
    try {
      const program = await this.prisma.program.create({
        data: {
          municipalityId,
          name: dto.name,
          description: dto.description,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          budget: dto.budget,
          eligibilityRules: dto.eligibilityRules,
        },
      });

      await this.audit.log({
        municipalityId,
        action: AuditAction.CREATE,
        entity: 'Program',
        entityId: program.id,
        newData: program,
      });

      return program;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ja existe um programa com este nome');
      }
      throw error;
    }
  }

  async findAll(municipalityId: string, query: ListProgramsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ProgramWhereInput = {
      municipalityId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.program.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.program.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(municipalityId: string, id: string) {
    const program = await this.prisma.program.findFirst({
      where: { id, municipalityId, deletedAt: null },
    });

    if (!program) {
      throw new NotFoundException('Programa nao encontrado');
    }

    return program;
  }

  async update(municipalityId: string, id: string, dto: UpdateProgramDto) {
    const existing = await this.findOne(municipalityId, id);

    const program = await this.prisma.program.update({
      where: { id: existing.id },
      data: {
        name: dto.name,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        budget: dto.budget,
        eligibilityRules: dto.eligibilityRules,
        status: dto.status,
      },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.UPDATE,
      entity: 'Program',
      entityId: program.id,
      oldData: existing,
      newData: program,
    });

    return program;
  }

  async remove(municipalityId: string, id: string) {
    const existing = await this.findOne(municipalityId, id);

    if (existing.deletedAt) {
      throw new ConflictException('Programa ja foi removido');
    }

    const program = await this.prisma.program.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.DELETE,
      entity: 'Program',
      entityId: program.id,
      oldData: existing,
    });

    return program;
  }
}
