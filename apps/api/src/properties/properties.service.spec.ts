import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { PropertiesService } from './properties.service.js';

const MUNICIPALITY_A = '11111111-1111-1111-1111-111111111111';
const PROPERTY_ID = '22222222-2222-2222-2222-222222222222';
const PRODUCER_OTHER_MUNICIPALITY = '33333333-3333-3333-3333-333333333333';

function buildService() {
  const prisma = {
    ruralProperty: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    producer: { findFirst: vi.fn() },
    producerProperty: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
  const audit = { log: vi.fn() };
  const service = new PropertiesService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
  );
  return { service, prisma, audit };
}

describe('PropertiesService (isolamento de tenant)', () => {
  let ctx: ReturnType<typeof buildService>;

  beforeEach(() => {
    ctx = buildService();
  });

  it('findOne nunca retorna propriedade de outro municipio', async () => {
    ctx.prisma.ruralProperty.findFirst.mockResolvedValue(null);

    await expect(
      ctx.service.findOne(MUNICIPALITY_A, PROPERTY_ID),
    ).rejects.toThrow(NotFoundException);

    expect(ctx.prisma.ruralProperty.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PROPERTY_ID, municipalityId: MUNICIPALITY_A, deletedAt: null },
      }),
    );
  });

  it('linkProducer rejeita produtor que nao pertence ao municipio da propriedade', async () => {
    ctx.prisma.ruralProperty.findFirst.mockResolvedValue({
      id: PROPERTY_ID,
      municipalityId: MUNICIPALITY_A,
      producerLinks: [],
    });
    // O produtor existe, mas a query ja filtra por este municipio - nao ha match.
    ctx.prisma.producer.findFirst.mockResolvedValue(null);

    await expect(
      ctx.service.linkProducer(MUNICIPALITY_A, PROPERTY_ID, {
        producerId: PRODUCER_OTHER_MUNICIPALITY,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(ctx.prisma.producer.findFirst).toHaveBeenCalledWith({
      where: {
        id: PRODUCER_OTHER_MUNICIPALITY,
        municipalityId: MUNICIPALITY_A,
        deletedAt: null,
      },
    });
    expect(ctx.prisma.producerProperty.create).not.toHaveBeenCalled();
  });

  it('linkProducer cria o vinculo quando produtor e propriedade sao do mesmo municipio', async () => {
    ctx.prisma.ruralProperty.findFirst.mockResolvedValue({
      id: PROPERTY_ID,
      municipalityId: MUNICIPALITY_A,
      producerLinks: [],
    });
    ctx.prisma.producer.findFirst.mockResolvedValue({
      id: 'producer-1',
      municipalityId: MUNICIPALITY_A,
    });
    ctx.prisma.producerProperty.create.mockResolvedValue({
      id: 'link-1',
      propertyId: PROPERTY_ID,
      producerId: 'producer-1',
    });

    await ctx.service.linkProducer(MUNICIPALITY_A, PROPERTY_ID, {
      producerId: 'producer-1',
    });

    expect(ctx.prisma.producerProperty.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          propertyId: PROPERTY_ID,
          producerId: 'producer-1',
        }),
      }),
    );
  });
});
