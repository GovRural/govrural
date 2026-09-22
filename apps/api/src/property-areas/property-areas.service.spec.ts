import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { PropertiesService } from '../properties/properties.service.js';
import { PropertyAreasService } from './property-areas.service.js';

const MUNICIPALITY_A = '11111111-1111-1111-1111-111111111111';
const PROPERTY_ID = '22222222-2222-2222-2222-222222222222';
const AREA_ID = '33333333-3333-3333-3333-333333333333';

function buildService() {
  const prisma = {
    propertyArea: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
  const audit = { log: vi.fn() };
  const propertiesService = { findOne: vi.fn() };
  const service = new PropertyAreasService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
    propertiesService as unknown as PropertiesService,
  );
  return { service, prisma, audit, propertiesService };
}

describe('PropertyAreasService (isolamento via propriedade-pai)', () => {
  let ctx: ReturnType<typeof buildService>;

  beforeEach(() => {
    ctx = buildService();
  });

  it('nunca cria area sem antes validar que a propriedade pertence ao municipio', async () => {
    ctx.propertiesService.findOne.mockRejectedValue(new NotFoundException());

    await expect(
      ctx.service.create(MUNICIPALITY_A, PROPERTY_ID, {
        name: 'Talhao 01',
        areaHectares: 10,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(ctx.propertiesService.findOne).toHaveBeenCalledWith(
      MUNICIPALITY_A,
      PROPERTY_ID,
    );
    expect(ctx.prisma.propertyArea.create).not.toHaveBeenCalled();
  });

  it('cria a area associada a propriedade quando esta pertence ao municipio', async () => {
    ctx.propertiesService.findOne.mockResolvedValue({
      id: PROPERTY_ID,
      municipalityId: MUNICIPALITY_A,
    });
    ctx.prisma.propertyArea.create.mockResolvedValue({
      id: AREA_ID,
      propertyId: PROPERTY_ID,
      name: 'Talhao 01',
    });

    await ctx.service.create(MUNICIPALITY_A, PROPERTY_ID, {
      name: 'Talhao 01',
      areaHectares: 10,
    });

    expect(ctx.prisma.propertyArea.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ propertyId: PROPERTY_ID }),
    });
  });

  it('findOne de uma area busca sempre escopado pelo propertyId', async () => {
    ctx.propertiesService.findOne.mockResolvedValue({
      id: PROPERTY_ID,
      municipalityId: MUNICIPALITY_A,
    });
    ctx.prisma.propertyArea.findFirst.mockResolvedValue(null);

    await expect(
      ctx.service.findOne(MUNICIPALITY_A, PROPERTY_ID, AREA_ID),
    ).rejects.toThrow(NotFoundException);

    expect(ctx.prisma.propertyArea.findFirst).toHaveBeenCalledWith({
      where: { id: AREA_ID, propertyId: PROPERTY_ID, deletedAt: null },
    });
  });
});
