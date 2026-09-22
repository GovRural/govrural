import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, MachineServiceStatus, Prisma } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateMachineServiceDto } from './dto/create-machine-service.dto.js';
import { ExecuteMachineServiceDto } from './dto/execute-machine-service.dto.js';
import { ListMachineServicesQueryDto } from './dto/list-machine-services-query.dto.js';
import { UpdateMachineServiceDto } from './dto/update-machine-service.dto.js';

const FINAL_STATUSES: MachineServiceStatus[] = [
  MachineServiceStatus.COMPLETED,
  MachineServiceStatus.CANCELLED,
];

@Injectable()
export class MachineServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(municipalityId: string, dto: CreateMachineServiceDto) {
    const machine = await this.prisma.machine.findFirst({
      where: { id: dto.machineId, municipalityId, deletedAt: null },
    });
    if (!machine) {
      throw new BadRequestException('Maquina invalida para este municipio');
    }

    const producer = await this.prisma.producer.findFirst({
      where: { id: dto.producerId, municipalityId, deletedAt: null },
    });
    if (!producer) {
      throw new BadRequestException('Produtor invalido para este municipio');
    }

    if (dto.propertyId) {
      await this.assertPropertyBelongsToProducer(
        municipalityId,
        dto.propertyId,
        dto.producerId,
      );
    }

    if (dto.operatorId) {
      await this.assertUserBelongs(dto.operatorId, municipalityId);
    }

    if (dto.serviceRequestId) {
      const serviceRequest = await this.prisma.serviceRequest.findFirst({
        where: { id: dto.serviceRequestId, municipalityId },
      });
      if (!serviceRequest) {
        throw new BadRequestException(
          'Solicitacao invalida para este municipio',
        );
      }
    }

    const machineService = await this.prisma.machineService.create({
      data: {
        municipalityId,
        machineId: dto.machineId,
        producerId: dto.producerId,
        propertyId: dto.propertyId,
        serviceRequestId: dto.serviceRequestId,
        operatorId: dto.operatorId,
        serviceType: dto.serviceType,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
        estimatedCost: dto.estimatedCost,
        notes: dto.notes,
      },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.CREATE,
      entity: 'MachineService',
      entityId: machineService.id,
      newData: machineService,
    });

    return machineService;
  }

  async findAll(municipalityId: string, query: ListMachineServicesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.MachineServiceWhereInput = {
      municipalityId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.machineId ? { machineId: query.machineId } : {}),
      ...(query.operatorId ? { operatorId: query.operatorId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.machineService.findMany({
        where,
        include: { machine: true, producer: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.machineService.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(municipalityId: string, id: string) {
    const machineService = await this.prisma.machineService.findFirst({
      where: { id, municipalityId },
      include: {
        machine: true,
        producer: true,
        property: true,
        operator: { select: { id: true, name: true } },
      },
    });

    if (!machineService) {
      throw new NotFoundException('Servico de maquina nao encontrado');
    }

    return machineService;
  }

  async update(
    municipalityId: string,
    id: string,
    dto: UpdateMachineServiceDto,
  ) {
    const existing = await this.findOne(municipalityId, id);
    this.assertNotFinal(existing.status);

    if (dto.propertyId) {
      await this.assertPropertyBelongsToProducer(
        municipalityId,
        dto.propertyId,
        existing.producerId,
      );
    }

    if (dto.operatorId) {
      await this.assertUserBelongs(dto.operatorId, municipalityId);
    }

    const machineService = await this.prisma.machineService.update({
      where: { id: existing.id },
      data: {
        status: dto.status,
        propertyId: dto.propertyId,
        operatorId: dto.operatorId,
        serviceRequestId: dto.serviceRequestId,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
        estimatedCost: dto.estimatedCost,
        notes: dto.notes,
      },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.UPDATE,
      entity: 'MachineService',
      entityId: machineService.id,
      oldData: existing,
      newData: machineService,
    });

    return machineService;
  }

  /**
   * Registro de execucao pelo operador (ver secao 8.5: inicio, termino,
   * horimetro, combustivel, observacoes). Calcula totalHours e actualCost
   * (secao 23: custo_hora x horas) quando ha dados suficientes, e sincroniza
   * o horimetro atual da maquina.
   */
  async execute(
    municipalityId: string,
    id: string,
    userId: string,
    dto: ExecuteMachineServiceDto,
  ) {
    const existing = await this.findOne(municipalityId, id);
    this.assertNotFinal(existing.status);

    const initialHourMeter =
      dto.initialHourMeter !== undefined
        ? new Prisma.Decimal(dto.initialHourMeter)
        : existing.initialHourMeter;
    const finalHourMeter =
      dto.finalHourMeter !== undefined
        ? new Prisma.Decimal(dto.finalHourMeter)
        : existing.finalHourMeter;
    const startTime = dto.startTime ? new Date(dto.startTime) : existing.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : existing.endTime;

    let totalHours = existing.totalHours;
    if (initialHourMeter && finalHourMeter) {
      totalHours = finalHourMeter.minus(initialHourMeter);
    } else if (startTime && endTime) {
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      totalHours = new Prisma.Decimal(hours.toFixed(2));
    }

    let status = existing.status;
    let actualCost = existing.actualCost;
    if (endTime || finalHourMeter) {
      status = MachineServiceStatus.COMPLETED;
      if (totalHours) {
        actualCost = existing.machine.hourlyCost.mul(totalHours);
      }
    } else if (startTime) {
      status = MachineServiceStatus.IN_PROGRESS;
    }

    const machineService = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.machineService.update({
        where: { id: existing.id },
        data: {
          startTime,
          endTime,
          initialHourMeter,
          finalHourMeter,
          fuelConsumption: dto.fuelConsumption ?? existing.fuelConsumption,
          latitude: dto.latitude ?? existing.latitude,
          longitude: dto.longitude ?? existing.longitude,
          notes: dto.notes ?? existing.notes,
          totalHours,
          actualCost,
          status,
        },
      });

      if (status === MachineServiceStatus.COMPLETED && finalHourMeter) {
        await tx.machine.update({
          where: { id: existing.machineId },
          data: { currentHourMeter: finalHourMeter },
        });
      }

      return updated;
    });

    await this.audit.log({
      municipalityId,
      userId,
      action: AuditAction.UPDATE,
      entity: 'MachineService',
      entityId: machineService.id,
      oldData: existing,
      newData: machineService,
    });

    return machineService;
  }

  private assertNotFinal(status: MachineServiceStatus) {
    if (FINAL_STATUSES.includes(status)) {
      throw new ConflictException(
        'Servico de maquina ja esta finalizado ou cancelado',
      );
    }
  }

  private async assertPropertyBelongsToProducer(
    municipalityId: string,
    propertyId: string,
    producerId: string,
  ) {
    const property = await this.prisma.ruralProperty.findFirst({
      where: { id: propertyId, municipalityId, deletedAt: null },
    });
    if (!property) {
      throw new BadRequestException('Propriedade invalida para este municipio');
    }

    const link = await this.prisma.producerProperty.findFirst({
      where: { propertyId, producerId, endDate: null },
    });
    if (!link) {
      throw new BadRequestException(
        'Esta propriedade nao esta vinculada ao produtor informado',
      );
    }
  }

  private async assertUserBelongs(userId: string, municipalityId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, municipalityId, deletedAt: null },
    });
    if (!user) {
      throw new BadRequestException(
        'Usuario invalido para atribuicao neste municipio',
      );
    }
  }
}
