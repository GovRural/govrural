import { BadRequestException, ConflictException } from '@nestjs/common';
import { MachineServiceStatus, Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { MachineServicesService } from './machine-services.service.js';

const MUNICIPALITY_A = '11111111-1111-1111-1111-111111111111';
const MACHINE_ID = '22222222-2222-2222-2222-222222222222';
const PRODUCER_ID = '33333333-3333-3333-3333-333333333333';
const SERVICE_ID = '44444444-4444-4444-4444-444444444444';
const USER_ID = '55555555-5555-5555-5555-555555555555';

function buildService() {
  const prisma = {
    machine: { findFirst: vi.fn(), update: vi.fn() },
    producer: { findFirst: vi.fn() },
    ruralProperty: { findFirst: vi.fn() },
    producerProperty: { findFirst: vi.fn() },
    user: { findFirst: vi.fn() },
    serviceRequest: { findFirst: vi.fn() },
    machineService: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  const audit = { log: vi.fn() };
  const service = new MachineServicesService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
  );
  return { service, prisma, audit };
}

describe('MachineServicesService', () => {
  let ctx: ReturnType<typeof buildService>;

  beforeEach(() => {
    ctx = buildService();
  });

  describe('create', () => {
    it('rejeita maquina que nao pertence ao municipio', async () => {
      ctx.prisma.machine.findFirst.mockResolvedValue(null);

      await expect(
        ctx.service.create(MUNICIPALITY_A, {
          machineId: MACHINE_ID,
          producerId: PRODUCER_ID,
          serviceType: 'Patrolamento',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(ctx.prisma.machineService.create).not.toHaveBeenCalled();
    });
  });

  describe('execute (calculo de custo - secao 23)', () => {
    it('calcula totalHours e actualCost a partir do horimetro', async () => {
      ctx.prisma.machineService.findFirst.mockResolvedValue({
        id: SERVICE_ID,
        municipalityId: MUNICIPALITY_A,
        machineId: MACHINE_ID,
        status: MachineServiceStatus.SCHEDULED,
        initialHourMeter: null,
        finalHourMeter: null,
        totalHours: null,
        actualCost: null,
        startTime: null,
        endTime: null,
        fuelConsumption: null,
        latitude: null,
        longitude: null,
        notes: null,
        machine: { hourlyCost: new Prisma.Decimal(180) },
      });

      let updateData: any;
      ctx.prisma.$transaction.mockImplementation(async (fn: any) =>
        fn({
          machineService: {
            update: vi.fn().mockImplementation(({ data }: any) => {
              updateData = data;
              return { id: SERVICE_ID, ...data };
            }),
          },
          machine: { update: vi.fn() },
        }),
      );

      await ctx.service.execute(MUNICIPALITY_A, SERVICE_ID, USER_ID, {
        initialHourMeter: 100,
        finalHourMeter: 104,
      });

      expect(updateData.totalHours.toString()).toBe('4');
      // 180/h * 4h = 720
      expect(updateData.actualCost.toString()).toBe('720');
      expect(updateData.status).toBe(MachineServiceStatus.COMPLETED);
    });

    it('calcula totalHours a partir de start/end quando nao ha horimetro', async () => {
      const startTime = new Date('2026-01-01T08:00:00Z');
      const endTime = new Date('2026-01-01T12:00:00Z');

      ctx.prisma.machineService.findFirst.mockResolvedValue({
        id: SERVICE_ID,
        municipalityId: MUNICIPALITY_A,
        machineId: MACHINE_ID,
        status: MachineServiceStatus.IN_PROGRESS,
        initialHourMeter: null,
        finalHourMeter: null,
        totalHours: null,
        actualCost: null,
        startTime,
        endTime: null,
        fuelConsumption: null,
        latitude: null,
        longitude: null,
        notes: null,
        machine: { hourlyCost: new Prisma.Decimal(100) },
      });

      let updateData: any;
      ctx.prisma.$transaction.mockImplementation(async (fn: any) =>
        fn({
          machineService: {
            update: vi.fn().mockImplementation(({ data }: any) => {
              updateData = data;
              return { id: SERVICE_ID, ...data };
            }),
          },
          machine: { update: vi.fn() },
        }),
      );

      await ctx.service.execute(MUNICIPALITY_A, SERVICE_ID, USER_ID, {
        endTime: endTime.toISOString(),
      });

      expect(updateData.totalHours.toString()).toBe('4');
      expect(updateData.actualCost.toString()).toBe('400');
    });

    it('marca IN_PROGRESS quando so o inicio e registrado', async () => {
      ctx.prisma.machineService.findFirst.mockResolvedValue({
        id: SERVICE_ID,
        municipalityId: MUNICIPALITY_A,
        machineId: MACHINE_ID,
        status: MachineServiceStatus.SCHEDULED,
        initialHourMeter: null,
        finalHourMeter: null,
        totalHours: null,
        actualCost: null,
        startTime: null,
        endTime: null,
        fuelConsumption: null,
        latitude: null,
        longitude: null,
        notes: null,
        machine: { hourlyCost: new Prisma.Decimal(100) },
      });

      let updateData: any;
      ctx.prisma.$transaction.mockImplementation(async (fn: any) =>
        fn({
          machineService: {
            update: vi.fn().mockImplementation(({ data }: any) => {
              updateData = data;
              return { id: SERVICE_ID, ...data };
            }),
          },
          machine: { update: vi.fn() },
        }),
      );

      await ctx.service.execute(MUNICIPALITY_A, SERVICE_ID, USER_ID, {
        startTime: '2026-01-01T08:00:00Z',
      });

      expect(updateData.status).toBe(MachineServiceStatus.IN_PROGRESS);
      expect(updateData.actualCost).toBeNull();
    });

    it('nao permite executar um servico ja concluido', async () => {
      ctx.prisma.machineService.findFirst.mockResolvedValue({
        id: SERVICE_ID,
        municipalityId: MUNICIPALITY_A,
        status: MachineServiceStatus.COMPLETED,
        machine: { hourlyCost: new Prisma.Decimal(100) },
      });

      await expect(
        ctx.service.execute(MUNICIPALITY_A, SERVICE_ID, USER_ID, {
          finalHourMeter: 10,
        }),
      ).rejects.toThrow(ConflictException);

      expect(ctx.prisma.$transaction).not.toHaveBeenCalled();
    });

    it('atualiza o horimetro atual da maquina ao concluir o servico', async () => {
      ctx.prisma.machineService.findFirst.mockResolvedValue({
        id: SERVICE_ID,
        municipalityId: MUNICIPALITY_A,
        machineId: MACHINE_ID,
        status: MachineServiceStatus.IN_PROGRESS,
        initialHourMeter: new Prisma.Decimal(50),
        finalHourMeter: null,
        totalHours: null,
        actualCost: null,
        startTime: null,
        endTime: null,
        fuelConsumption: null,
        latitude: null,
        longitude: null,
        notes: null,
        machine: { hourlyCost: new Prisma.Decimal(100) },
      });

      const machineUpdate = vi.fn();
      ctx.prisma.$transaction.mockImplementation(async (fn: any) =>
        fn({
          machineService: {
            update: vi.fn().mockResolvedValue({ id: SERVICE_ID }),
          },
          machine: { update: machineUpdate },
        }),
      );

      await ctx.service.execute(MUNICIPALITY_A, SERVICE_ID, USER_ID, {
        finalHourMeter: 58,
      });

      expect(machineUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: MACHINE_ID },
          data: { currentHourMeter: expect.anything() },
        }),
      );
    });
  });
});
