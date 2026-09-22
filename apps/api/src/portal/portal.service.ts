import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MachineServiceStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { ServiceRequestsService } from '../service-requests/service-requests.service.js';
import { AuthenticatedUser } from '../auth/types.js';
import { CreatePortalServiceRequestDto } from './dto/create-portal-service-request.dto.js';

const OPEN_SERVICE_REQUEST_STATUSES = [
  'RECEIVED',
  'UNDER_ANALYSIS',
  'APPROVED',
  'SCHEDULED',
  'IN_PROGRESS',
  'WAITING_DOCUMENT',
] as const;

/**
 * Portal do produtor (ver secao 32). Todo endpoint aqui atua sempre em nome
 * do producerId vinculado ao usuario logado (AuthenticatedUser.producerId) -
 * nunca aceita um producerId arbitrario do client.
 */
@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  private requireProducerId(user: AuthenticatedUser): string {
    if (!user.producerId) {
      throw new ForbiddenException(
        'Usuario nao esta vinculado a um cadastro de produtor',
      );
    }
    return user.producerId;
  }

  async getMe(user: AuthenticatedUser) {
    const producerId = this.requireProducerId(user);

    const producer = await this.prisma.producer.findFirst({
      where: { id: producerId, deletedAt: null },
    });

    if (!producer) {
      throw new NotFoundException('Cadastro de produtor nao encontrado');
    }

    const [propertiesCount, openRequests, completedMachineServices, programBenefits] =
      await Promise.all([
        this.prisma.producerProperty.count({
          where: { producerId, endDate: null },
        }),
        this.prisma.serviceRequest.count({
          where: { producerId, status: { in: [...OPEN_SERVICE_REQUEST_STATUSES] } },
        }),
        this.prisma.machineService.count({
          where: { producerId, status: MachineServiceStatus.COMPLETED },
        }),
        this.prisma.programBeneficiary.count({ where: { producerId } }),
      ]);

    return {
      name: producer.name,
      properties: propertiesCount,
      openServiceRequests: openRequests,
      completedServices: completedMachineServices,
      programBenefits,
    };
  }

  async getProperties(user: AuthenticatedUser) {
    const producerId = this.requireProducerId(user);

    const links = await this.prisma.producerProperty.findMany({
      where: { producerId, endDate: null },
      include: { property: true },
    });

    return links.map((link) => link.property);
  }

  async getServiceRequests(user: AuthenticatedUser) {
    const producerId = this.requireProducerId(user);

    return this.prisma.serviceRequest.findMany({
      where: { producerId },
      include: { serviceType: true, department: true },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async createServiceRequest(
    user: AuthenticatedUser,
    dto: CreatePortalServiceRequestDto,
  ) {
    const producerId = this.requireProducerId(user);

    if (!user.municipalityId) {
      throw new ForbiddenException('Usuario nao esta vinculado a um municipio');
    }

    return this.serviceRequestsService.create(user.municipalityId, user.id, {
      producerId,
      propertyId: dto.propertyId,
      departmentId: dto.departmentId,
      serviceTypeId: dto.serviceTypeId,
      description: dto.description,
    });
  }

  async getPrograms(user: AuthenticatedUser) {
    const producerId = this.requireProducerId(user);

    return this.prisma.programBeneficiary.findMany({
      where: { producerId },
      include: { program: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
