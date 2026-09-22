import { NotFoundException } from '@nestjs/common';
import { OccurrenceStatus, OccurrenceType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { OccurrencesService } from './occurrences.service.js';

const MUNICIPALITY_A = '11111111-1111-1111-1111-111111111111';
const OCCURRENCE_ID = '22222222-2222-2222-2222-222222222222';
const USER_ID = '33333333-3333-3333-3333-333333333333';

function buildService() {
  const prisma = {
    ruralOccurrence: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    department: { findFirst: vi.fn() },
  };
  const audit = { log: vi.fn() };
  const service = new OccurrencesService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
  );
  return { service, prisma, audit };
}

describe('OccurrencesService', () => {
  let ctx: ReturnType<typeof buildService>;

  beforeEach(() => {
    ctx = buildService();
  });

  it('findOne nunca retorna ocorrencia de outro municipio', async () => {
    ctx.prisma.ruralOccurrence.findFirst.mockResolvedValue(null);

    await expect(
      ctx.service.findOne(MUNICIPALITY_A, OCCURRENCE_ID),
    ).rejects.toThrow(NotFoundException);

    expect(ctx.prisma.ruralOccurrence.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: OCCURRENCE_ID, municipalityId: MUNICIPALITY_A },
      }),
    );
  });

  it('seta resolvedAt ao mudar o status para RESOLVED', async () => {
    ctx.prisma.ruralOccurrence.findFirst.mockResolvedValue({
      id: OCCURRENCE_ID,
      municipalityId: MUNICIPALITY_A,
      status: OccurrenceStatus.OPEN,
      resolvedAt: null,
    });
    ctx.prisma.ruralOccurrence.update.mockResolvedValue({
      id: OCCURRENCE_ID,
      status: OccurrenceStatus.RESOLVED,
    });

    await ctx.service.update(MUNICIPALITY_A, OCCURRENCE_ID, USER_ID, {
      status: OccurrenceStatus.RESOLVED,
    });

    expect(ctx.prisma.ruralOccurrence.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ resolvedAt: expect.any(Date) }),
      }),
    );
  });

  it('limpa resolvedAt ao reabrir uma ocorrencia resolvida', async () => {
    ctx.prisma.ruralOccurrence.findFirst.mockResolvedValue({
      id: OCCURRENCE_ID,
      municipalityId: MUNICIPALITY_A,
      status: OccurrenceStatus.RESOLVED,
      resolvedAt: new Date('2026-01-01'),
    });
    ctx.prisma.ruralOccurrence.update.mockResolvedValue({
      id: OCCURRENCE_ID,
      status: OccurrenceStatus.IN_PROGRESS,
    });

    await ctx.service.update(MUNICIPALITY_A, OCCURRENCE_ID, USER_ID, {
      status: OccurrenceStatus.IN_PROGRESS,
    });

    expect(ctx.prisma.ruralOccurrence.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ resolvedAt: null }),
      }),
    );
  });

  it('nao altera resolvedAt quando o status nao muda de/para RESOLVED', async () => {
    ctx.prisma.ruralOccurrence.findFirst.mockResolvedValue({
      id: OCCURRENCE_ID,
      municipalityId: MUNICIPALITY_A,
      status: OccurrenceStatus.OPEN,
      resolvedAt: null,
    });
    ctx.prisma.ruralOccurrence.update.mockResolvedValue({
      id: OCCURRENCE_ID,
      status: OccurrenceStatus.IN_PROGRESS,
    });

    await ctx.service.update(MUNICIPALITY_A, OCCURRENCE_ID, USER_ID, {
      status: OccurrenceStatus.IN_PROGRESS,
    });

    expect(ctx.prisma.ruralOccurrence.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ resolvedAt: null }),
      }),
    );
  });

  it('create grava o municipalityId e o reporterUserId do tenant atual', async () => {
    ctx.prisma.ruralOccurrence.create.mockResolvedValue({
      id: OCCURRENCE_ID,
      municipalityId: MUNICIPALITY_A,
      reporterUserId: USER_ID,
    });

    await ctx.service.create(MUNICIPALITY_A, USER_ID, {
      type: OccurrenceType.ROAD,
      title: 'Estrada intransitavel',
      description: 'Apos chuva forte',
    });

    expect(ctx.prisma.ruralOccurrence.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        municipalityId: MUNICIPALITY_A,
        reporterUserId: USER_ID,
      }),
    });
  });
});
