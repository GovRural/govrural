import { NotFoundException } from '@nestjs/common';
import { ProducerType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { ProducersService } from './producers.service.js';

const MUNICIPALITY_A = '11111111-1111-1111-1111-111111111111';
const MUNICIPALITY_B = '22222222-2222-2222-2222-222222222222';
const PRODUCER_ID = '33333333-3333-3333-3333-333333333333';

function buildService() {
  const prisma = {
    producer: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
  const audit = { log: vi.fn() };
  const service = new ProducersService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
  );
  return { service, prisma, audit };
}

describe('ProducersService (isolamento de tenant)', () => {
  let ctx: ReturnType<typeof buildService>;

  beforeEach(() => {
    ctx = buildService();
  });

  it('create sempre grava o municipalityId do tenant atual', async () => {
    ctx.prisma.producer.create.mockResolvedValue({
      id: PRODUCER_ID,
      municipalityId: MUNICIPALITY_B,
      name: 'Joao',
    });

    await ctx.service.create(MUNICIPALITY_B, {
      name: 'Joao',
      cpfCnpj: '12345678901',
      producerType: ProducerType.INDIVIDUAL,
    });

    expect(ctx.prisma.producer.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ municipalityId: MUNICIPALITY_B }),
    });
  });

  it('findOne nunca retorna um produtor de outro municipio', async () => {
    ctx.prisma.producer.findFirst.mockResolvedValue(null);

    await expect(
      ctx.service.findOne(MUNICIPALITY_A, PRODUCER_ID),
    ).rejects.toThrow(NotFoundException);

    expect(ctx.prisma.producer.findFirst).toHaveBeenCalledWith({
      where: { id: PRODUCER_ID, municipalityId: MUNICIPALITY_A, deletedAt: null },
    });
  });

  it('findAll sempre filtra por municipalityId, mesmo sem outros filtros', async () => {
    ctx.prisma.producer.findMany.mockResolvedValue([]);
    ctx.prisma.producer.count.mockResolvedValue(0);

    await ctx.service.findAll(MUNICIPALITY_A, { page: 1, limit: 20 });

    const where = ctx.prisma.producer.findMany.mock.calls[0][0].where;
    expect(where.municipalityId).toBe(MUNICIPALITY_A);
  });

  it('busca por search normaliza cpf/cnpj removendo mascara', async () => {
    ctx.prisma.producer.findMany.mockResolvedValue([]);
    ctx.prisma.producer.count.mockResolvedValue(0);

    await ctx.service.findAll(MUNICIPALITY_A, {
      page: 1,
      limit: 20,
      search: '123.456.789-01',
    });

    const where = ctx.prisma.producer.findMany.mock.calls[0][0].where;
    expect(where.OR).toEqual([
      { name: { contains: '123.456.789-01', mode: 'insensitive' } },
      { cpfCnpj: { contains: '12345678901' } },
    ]);
  });
});
