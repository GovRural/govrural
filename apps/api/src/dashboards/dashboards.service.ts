import { Injectable } from '@nestjs/common';
import { MachineServiceStatus, ServiceRequestStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';

const OPEN_SERVICE_REQUEST_STATUSES: ServiceRequestStatus[] = [
  ServiceRequestStatus.RECEIVED,
  ServiceRequestStatus.UNDER_ANALYSIS,
  ServiceRequestStatus.APPROVED,
  ServiceRequestStatus.SCHEDULED,
  ServiceRequestStatus.IN_PROGRESS,
  ServiceRequestStatus.WAITING_DOCUMENT,
];

const OPEN_OCCURRENCE_STATUSES = ['OPEN', 'IN_PROGRESS'] as const;

/**
 * Indicadores dos dashboards (ver secoes 39-42). Os mesmos endpoints servem
 * o prefeito/secretario/tecnico - a diferenca de visao entre perfis e uma
 * composicao do frontend, nao um endpoint separado por perfil.
 */
@Injectable()
export class DashboardsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(municipalityId: string) {
    const [
      producers,
      properties,
      serviceRequestsTotal,
      serviceRequestsPending,
      machineServicesCompleted,
      machineAgg,
      programs,
      beneficiaries,
      occurrencesTotal,
      occurrencesOpen,
    ] = await Promise.all([
      this.prisma.producer.count({ where: { municipalityId, deletedAt: null } }),
      this.prisma.ruralProperty.count({ where: { municipalityId, deletedAt: null } }),
      this.prisma.serviceRequest.count({ where: { municipalityId } }),
      this.prisma.serviceRequest.count({
        where: { municipalityId, status: { in: OPEN_SERVICE_REQUEST_STATUSES } },
      }),
      this.prisma.machineService.count({
        where: { municipalityId, status: MachineServiceStatus.COMPLETED },
      }),
      this.prisma.machineService.aggregate({
        where: { municipalityId, status: MachineServiceStatus.COMPLETED },
        _sum: { totalHours: true, actualCost: true, estimatedCost: true },
      }),
      this.prisma.program.count({ where: { municipalityId, deletedAt: null } }),
      this.prisma.programBeneficiary.count({
        where: { program: { municipalityId } },
      }),
      this.prisma.ruralOccurrence.count({ where: { municipalityId } }),
      this.prisma.ruralOccurrence.count({
        where: { municipalityId, status: { in: [...OPEN_OCCURRENCE_STATUSES] } },
      }),
    ]);

    return {
      producers,
      properties,
      serviceRequests: { total: serviceRequestsTotal, pending: serviceRequestsPending },
      machineServicesCompleted,
      machineHours: machineAgg._sum.totalHours ?? 0,
      machineCost: {
        estimated: machineAgg._sum.estimatedCost ?? 0,
        actual: machineAgg._sum.actualCost ?? 0,
      },
      programs,
      beneficiaries,
      occurrences: { total: occurrencesTotal, open: occurrencesOpen },
    };
  }

  /** Ver secao 42: tempo medio de atendimento e taxa de conclusao. */
  async getServiceRequestMetrics(municipalityId: string) {
    const [total, completed, byStatus] = await Promise.all([
      this.prisma.serviceRequest.count({ where: { municipalityId } }),
      this.prisma.serviceRequest.findMany({
        where: { municipalityId, status: ServiceRequestStatus.COMPLETED, completedAt: { not: null } },
        select: { requestedAt: true, completedAt: true },
      }),
      this.prisma.serviceRequest.groupBy({
        by: ['status'],
        where: { municipalityId },
        _count: { _all: true },
      }),
    ]);

    const avgResolutionHours =
      completed.length > 0
        ? completed.reduce(
            (sum, r) => sum + (r.completedAt!.getTime() - r.requestedAt.getTime()),
            0,
          ) /
          completed.length /
          (1000 * 60 * 60)
        : null;

    return {
      total,
      completed: completed.length,
      completionRate: total > 0 ? completed.length / total : 0,
      avgResolutionHours,
      byStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
    };
  }

  async getMachinesMetrics(municipalityId: string) {
    const byMachine = await this.prisma.machineService.groupBy({
      by: ['machineId'],
      where: { municipalityId, status: MachineServiceStatus.COMPLETED },
      _sum: { totalHours: true, actualCost: true },
      _count: { _all: true },
    });

    const machines = await this.prisma.machine.findMany({
      where: { id: { in: byMachine.map((row) => row.machineId) } },
      select: { id: true, name: true, type: true },
    });
    const machineById = new Map(machines.map((m) => [m.id, m]));

    return byMachine.map((row) => ({
      machine: machineById.get(row.machineId) ?? null,
      servicesCompleted: row._count._all,
      totalHours: row._sum.totalHours ?? 0,
      totalCost: row._sum.actualCost ?? 0,
    }));
  }

  async getProgramsMetrics(municipalityId: string) {
    const programs = await this.prisma.program.findMany({
      where: { municipalityId, deletedAt: null },
      include: {
        _count: { select: { beneficiaries: true } },
        beneficiaries: { select: { value: true, status: true } },
      },
    });

    return programs.map((program) => ({
      id: program.id,
      name: program.name,
      status: program.status,
      budget: program.budget,
      beneficiariesCount: program._count.beneficiaries,
      delivered: program.beneficiaries.filter((b) => b.status === 'DELIVERED').length,
      totalValueDelivered: program.beneficiaries
        .filter((b) => b.status === 'DELIVERED' && b.value)
        .reduce((sum, b) => sum + Number(b.value), 0),
    }));
  }

  async getOccurrencesMetrics(municipalityId: string) {
    const [byType, byPriority, byStatus] = await Promise.all([
      this.prisma.ruralOccurrence.groupBy({
        by: ['type'],
        where: { municipalityId },
        _count: { _all: true },
      }),
      this.prisma.ruralOccurrence.groupBy({
        by: ['priority'],
        where: { municipalityId },
        _count: { _all: true },
      }),
      this.prisma.ruralOccurrence.groupBy({
        by: ['status'],
        where: { municipalityId },
        _count: { _all: true },
      }),
    ]);

    return {
      byType: byType.map((row) => ({ type: row.type, count: row._count._all })),
      byPriority: byPriority.map((row) => ({ priority: row.priority, count: row._count._all })),
      byStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
    };
  }
}
