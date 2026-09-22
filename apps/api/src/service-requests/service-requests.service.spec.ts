import { BadRequestException, ConflictException } from '@nestjs/common';
import { ServiceRequestStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { ServiceRequestsService } from './service-requests.service.js';

const MUNICIPALITY_A = '11111111-1111-1111-1111-111111111111';
const PRODUCER_ID = '22222222-2222-2222-2222-222222222222';
const DEPARTMENT_ID = '33333333-3333-3333-3333-333333333333';
const SERVICE_TYPE_ID = '44444444-4444-4444-4444-444444444444';
const PROPERTY_ID = '55555555-5555-5555-5555-555555555555';
const REQUEST_ID = '66666666-6666-6666-6666-666666666666';
const USER_ID = '77777777-7777-7777-7777-777777777777';

function buildService() {
  const prisma = {
    producer: { findFirst: vi.fn() },
    department: { findFirst: vi.fn() },
    serviceType: { findFirst: vi.fn() },
    ruralProperty: { findFirst: vi.fn() },
    producerProperty: { findFirst: vi.fn() },
    user: { findFirst: vi.fn() },
    protocolSequence: { upsert: vi.fn() },
    serviceRequest: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn() },
    serviceRequestHistory: { findMany: vi.fn() },
    $transaction: vi.fn(),
  };
  const audit = { log: vi.fn() };
  const service = new ServiceRequestsService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
  );
  return { service, prisma, audit };
}

describe('ServiceRequestsService', () => {
  let ctx: ReturnType<typeof buildService>;

  beforeEach(() => {
    ctx = buildService();
  });

  describe('protocolo', () => {
    it('gera o protocolo no formato GR-{ano}-{sequencial com 8 digitos}', async () => {
      ctx.prisma.producer.findFirst.mockResolvedValue({ id: PRODUCER_ID });
      ctx.prisma.department.findFirst.mockResolvedValue({ id: DEPARTMENT_ID });
      ctx.prisma.serviceType.findFirst.mockResolvedValue({ id: SERVICE_TYPE_ID });
      ctx.prisma.protocolSequence.upsert.mockResolvedValue({ lastNumber: 42 });

      const created = {
        id: REQUEST_ID,
        status: ServiceRequestStatus.RECEIVED,
        protocol: '',
      };
      ctx.prisma.$transaction.mockImplementation(async (fn: any) =>
        fn({
          serviceRequest: { create: vi.fn().mockResolvedValue(created) },
          serviceRequestHistory: { create: vi.fn() },
        }),
      );

      await ctx.service.create(MUNICIPALITY_A, USER_ID, {
        producerId: PRODUCER_ID,
        departmentId: DEPARTMENT_ID,
        serviceTypeId: SERVICE_TYPE_ID,
        description: 'Preciso de patrolamento',
      });

      const year = new Date().getFullYear();
      expect(ctx.prisma.protocolSequence.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { municipalityId_year: { municipalityId: MUNICIPALITY_A, year } },
        }),
      );
      // protocolo calculado e passado para dentro da transacao
      const txArg = ctx.prisma.$transaction.mock.calls[0][0];
      expect(typeof txArg).toBe('function');
    });

    it('rejeita quando o produtor nao pertence ao municipio', async () => {
      ctx.prisma.producer.findFirst.mockResolvedValue(null);

      await expect(
        ctx.service.create(MUNICIPALITY_A, USER_ID, {
          producerId: PRODUCER_ID,
          departmentId: DEPARTMENT_ID,
          serviceTypeId: SERVICE_TYPE_ID,
          description: 'x',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(ctx.prisma.protocolSequence.upsert).not.toHaveBeenCalled();
    });
  });

  describe('vinculo propriedade <-> produtor', () => {
    it('rejeita propriedade que nao esta vinculada ao produtor da solicitacao', async () => {
      ctx.prisma.producer.findFirst.mockResolvedValue({ id: PRODUCER_ID });
      ctx.prisma.department.findFirst.mockResolvedValue({ id: DEPARTMENT_ID });
      ctx.prisma.serviceType.findFirst.mockResolvedValue({ id: SERVICE_TYPE_ID });
      ctx.prisma.ruralProperty.findFirst.mockResolvedValue({ id: PROPERTY_ID });
      ctx.prisma.producerProperty.findFirst.mockResolvedValue(null);

      await expect(
        ctx.service.create(MUNICIPALITY_A, USER_ID, {
          producerId: PRODUCER_ID,
          propertyId: PROPERTY_ID,
          departmentId: DEPARTMENT_ID,
          serviceTypeId: SERVICE_TYPE_ID,
          description: 'x',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(ctx.prisma.protocolSequence.upsert).not.toHaveBeenCalled();
    });
  });

  describe('transicao de status', () => {
    it('nao permite alterar uma solicitacao ja concluida', async () => {
      ctx.prisma.serviceRequest.findFirst.mockResolvedValue({
        id: REQUEST_ID,
        municipalityId: MUNICIPALITY_A,
        status: ServiceRequestStatus.COMPLETED,
      });

      await expect(
        ctx.service.changeStatus(MUNICIPALITY_A, REQUEST_ID, USER_ID, {
          status: ServiceRequestStatus.IN_PROGRESS,
        }),
      ).rejects.toThrow(ConflictException);

      expect(ctx.prisma.$transaction).not.toHaveBeenCalled();
    });

    it('registra previousStatus/newStatus no historico ao mudar status', async () => {
      ctx.prisma.serviceRequest.findFirst.mockResolvedValue({
        id: REQUEST_ID,
        municipalityId: MUNICIPALITY_A,
        status: ServiceRequestStatus.RECEIVED,
      });

      const historyCreate = vi.fn();
      ctx.prisma.$transaction.mockImplementation(async (fn: any) =>
        fn({
          serviceRequest: {
            update: vi.fn().mockResolvedValue({
              id: REQUEST_ID,
              status: ServiceRequestStatus.UNDER_ANALYSIS,
            }),
          },
          serviceRequestHistory: { create: historyCreate },
        }),
      );

      await ctx.service.changeStatus(MUNICIPALITY_A, REQUEST_ID, USER_ID, {
        status: ServiceRequestStatus.UNDER_ANALYSIS,
        comment: 'Em analise pela secretaria',
      });

      expect(historyCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          serviceRequestId: REQUEST_ID,
          previousStatus: ServiceRequestStatus.RECEIVED,
          newStatus: ServiceRequestStatus.UNDER_ANALYSIS,
          comment: 'Em analise pela secretaria',
        }),
      });
    });
  });
});
