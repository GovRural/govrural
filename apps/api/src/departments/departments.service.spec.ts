import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { DepartmentsService } from './departments.service.js';

const MUNICIPALITY_A = '11111111-1111-1111-1111-111111111111';
const MUNICIPALITY_B = '22222222-2222-2222-2222-222222222222';
const DEPARTMENT_ID = '33333333-3333-3333-3333-333333333333';

describe('DepartmentsService (isolamento de tenant)', () => {
  let service: DepartmentsService;
  let prisma: {
    department: {
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let audit: { log: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = {
      department: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
    audit = { log: vi.fn() };

    service = new DepartmentsService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
  });

  it('busca sempre filtrando por municipalityId', async () => {
    prisma.department.findFirst.mockResolvedValue({
      id: DEPARTMENT_ID,
      municipalityId: MUNICIPALITY_A,
      deletedAt: null,
    });

    await service.findOne(MUNICIPALITY_A, DEPARTMENT_ID);

    expect(prisma.department.findFirst).toHaveBeenCalledWith({
      where: { id: DEPARTMENT_ID, municipalityId: MUNICIPALITY_A, deletedAt: null },
    });
  });

  it('nao retorna registro de outro municipio (404, nao os dados)', async () => {
    // Simula o comportamento real do Prisma: o registro pertence ao
    // municipio B, mas a query ja filtra por municipio A - nao existe match.
    prisma.department.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne(MUNICIPALITY_A, DEPARTMENT_ID),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.department.findFirst).toHaveBeenCalledWith({
      where: { id: DEPARTMENT_ID, municipalityId: MUNICIPALITY_A, deletedAt: null },
    });
  });

  it('create sempre grava o municipalityId do tenant atual', async () => {
    prisma.department.create.mockResolvedValue({
      id: DEPARTMENT_ID,
      municipalityId: MUNICIPALITY_B,
      name: 'Agricultura',
    });

    await service.create(MUNICIPALITY_B, { name: 'Agricultura' });

    expect(prisma.department.create).toHaveBeenCalledWith({
      data: { name: 'Agricultura', municipalityId: MUNICIPALITY_B },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ municipalityId: MUNICIPALITY_B }),
    );
  });
});
