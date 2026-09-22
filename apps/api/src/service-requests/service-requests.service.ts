import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma, ServiceRequestStatus } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { ChangeServiceRequestStatusDto } from './dto/change-status.dto.js';
import { CreateServiceRequestDto } from './dto/create-service-request.dto.js';
import { ListServiceRequestsQueryDto } from './dto/list-service-requests-query.dto.js';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto.js';

const FINAL_STATUSES: ServiceRequestStatus[] = [
  ServiceRequestStatus.COMPLETED,
  ServiceRequestStatus.REJECTED,
  ServiceRequestStatus.CANCELLED,
];

const STATUS_TIMESTAMP_FIELD: Partial<
  Record<ServiceRequestStatus, 'analyzedAt' | 'approvedAt' | 'scheduledAt' | 'completedAt'>
> = {
  UNDER_ANALYSIS: 'analyzedAt',
  APPROVED: 'approvedAt',
  SCHEDULED: 'scheduledAt',
  COMPLETED: 'completedAt',
};

@Injectable()
export class ServiceRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    municipalityId: string,
    userId: string,
    dto: CreateServiceRequestDto,
  ) {
    const producer = await this.prisma.producer.findFirst({
      where: { id: dto.producerId, municipalityId, deletedAt: null },
    });
    if (!producer) {
      throw new BadRequestException('Produtor invalido para este municipio');
    }

    const department = await this.prisma.department.findFirst({
      where: { id: dto.departmentId, municipalityId, deletedAt: null },
    });
    if (!department) {
      throw new BadRequestException('Secretaria invalida para este municipio');
    }

    const serviceType = await this.prisma.serviceType.findFirst({
      where: { id: dto.serviceTypeId, municipalityId, deletedAt: null },
    });
    if (!serviceType) {
      throw new BadRequestException('Tipo de servico invalido para este municipio');
    }

    if (dto.propertyId) {
      await this.assertPropertyBelongsToProducer(
        municipalityId,
        dto.propertyId,
        dto.producerId,
      );
    }

    const protocol = await this.nextProtocol(municipalityId);

    const serviceRequest = await this.prisma.$transaction(async (tx) => {
      const created = await tx.serviceRequest.create({
        data: {
          municipalityId,
          protocol,
          producerId: dto.producerId,
          propertyId: dto.propertyId,
          departmentId: dto.departmentId,
          serviceTypeId: dto.serviceTypeId,
          description: dto.description,
          priority: dto.priority,
          latitude: dto.latitude,
          longitude: dto.longitude,
          estimatedCost: dto.estimatedCost,
          notes: dto.notes,
        },
      });

      await tx.serviceRequestHistory.create({
        data: {
          serviceRequestId: created.id,
          userId,
          previousStatus: null,
          newStatus: created.status,
        },
      });

      return created;
    });

    await this.audit.log({
      municipalityId,
      userId,
      action: AuditAction.CREATE,
      entity: 'ServiceRequest',
      entityId: serviceRequest.id,
      newData: serviceRequest,
    });

    return serviceRequest;
  }

  async findAll(municipalityId: string, query: ListServiceRequestsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ServiceRequestWhereInput = {
      municipalityId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.producerId ? { producerId: query.producerId } : {}),
      ...(query.search
        ? {
            OR: [
              { protocol: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where,
        include: { producer: true, serviceType: true, department: true },
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.serviceRequest.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(municipalityId: string, id: string) {
    const serviceRequest = await this.prisma.serviceRequest.findFirst({
      where: { id, municipalityId },
      include: {
        producer: true,
        property: true,
        department: true,
        serviceType: true,
        assignedUser: true,
      },
    });

    if (!serviceRequest) {
      throw new NotFoundException('Solicitacao nao encontrada');
    }

    return serviceRequest;
  }

  async findHistory(municipalityId: string, id: string) {
    await this.findOne(municipalityId, id);

    return this.prisma.serviceRequestHistory.findMany({
      where: { serviceRequestId: id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(
    municipalityId: string,
    id: string,
    userId: string,
    dto: UpdateServiceRequestDto,
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

    if (dto.assignedUserId) {
      await this.assertUserBelongs(dto.assignedUserId, municipalityId);
    }

    const serviceRequest = await this.prisma.serviceRequest.update({
      where: { id: existing.id },
      data: dto,
    });

    await this.audit.log({
      municipalityId,
      userId,
      action: AuditAction.UPDATE,
      entity: 'ServiceRequest',
      entityId: serviceRequest.id,
      oldData: existing,
      newData: serviceRequest,
    });

    return serviceRequest;
  }

  async changeStatus(
    municipalityId: string,
    id: string,
    userId: string,
    dto: ChangeServiceRequestStatusDto,
  ) {
    const existing = await this.findOne(municipalityId, id);
    this.assertNotFinal(existing.status);

    const timestampField = STATUS_TIMESTAMP_FIELD[dto.status];

    const serviceRequest = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.serviceRequest.update({
        where: { id: existing.id },
        data: {
          status: dto.status,
          ...(timestampField ? { [timestampField]: new Date() } : {}),
        },
      });

      await tx.serviceRequestHistory.create({
        data: {
          serviceRequestId: existing.id,
          userId,
          previousStatus: existing.status,
          newStatus: dto.status,
          comment: dto.comment,
          latitude: dto.latitude,
          longitude: dto.longitude,
        },
      });

      return updated;
    });

    await this.audit.log({
      municipalityId,
      userId,
      action: this.auditActionForStatus(dto.status),
      entity: 'ServiceRequest',
      entityId: serviceRequest.id,
      oldData: { status: existing.status },
      newData: { status: serviceRequest.status },
    });

    return serviceRequest;
  }

  private async nextProtocol(municipalityId: string): Promise<string> {
    const year = new Date().getFullYear();

    const sequence = await this.prisma.protocolSequence.upsert({
      where: { municipalityId_year: { municipalityId, year } },
      create: { municipalityId, year, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });

    return `GR-${year}-${String(sequence.lastNumber).padStart(8, '0')}`;
  }

  private assertNotFinal(status: ServiceRequestStatus) {
    if (FINAL_STATUSES.includes(status)) {
      throw new ConflictException(
        'Solicitacao ja esta em um status final (concluida, rejeitada ou cancelada)',
      );
    }
  }

  private auditActionForStatus(status: ServiceRequestStatus): AuditAction {
    if (status === ServiceRequestStatus.APPROVED) return AuditAction.APPROVE;
    if (status === ServiceRequestStatus.REJECTED) return AuditAction.REJECT;
    return AuditAction.UPDATE;
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
