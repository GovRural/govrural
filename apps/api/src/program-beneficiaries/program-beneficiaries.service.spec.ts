import { BadRequestException } from '@nestjs/common';
import { ProgramBeneficiaryStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { ProgramsService } from '../programs/programs.service.js';
import { ProgramBeneficiariesService } from './program-beneficiaries.service.js';

const MUNICIPALITY_A = '11111111-1111-1111-1111-111111111111';
const PROGRAM_ID = '22222222-2222-2222-2222-222222222222';
const PRODUCER_ID = '33333333-3333-3333-3333-333333333333';
const BENEFICIARY_ID = '44444444-4444-4444-4444-444444444444';

function buildService() {
  const prisma = {
    producer: { findFirst: vi.fn() },
    ruralProperty: { findFirst: vi.fn() },
    producerProperty: { findFirst: vi.fn() },
    programBeneficiary: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
  const audit = { log: vi.fn() };
  const programsService = { findOne: vi.fn().mockResolvedValue({ id: PROGRAM_ID }) };
  const service = new ProgramBeneficiariesService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
    programsService as unknown as ProgramsService,
  );
  return { service, prisma, audit, programsService };
}

describe('ProgramBeneficiariesService', () => {
  let ctx: ReturnType<typeof buildService>;

  beforeEach(() => {
    ctx = buildService();
  });

  it('rejeita produtor que nao pertence ao municipio do programa', async () => {
    ctx.prisma.producer.findFirst.mockResolvedValue(null);

    await expect(
      ctx.service.create(MUNICIPALITY_A, PROGRAM_ID, {
        producerId: PRODUCER_ID,
        benefitType: 'Calcario',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(ctx.prisma.programBeneficiary.create).not.toHaveBeenCalled();
  });

  it('preenche approvalDate automaticamente ao aprovar', async () => {
    ctx.prisma.programBeneficiary.findFirst.mockResolvedValue({
      id: BENEFICIARY_ID,
      producerId: PRODUCER_ID,
      status: ProgramBeneficiaryStatus.PENDING,
      approvalDate: null,
      deliveryDate: null,
    });
    ctx.prisma.programBeneficiary.update.mockResolvedValue({
      id: BENEFICIARY_ID,
      status: ProgramBeneficiaryStatus.APPROVED,
    });

    await ctx.service.update(MUNICIPALITY_A, PROGRAM_ID, BENEFICIARY_ID, {
      status: ProgramBeneficiaryStatus.APPROVED,
    });

    expect(ctx.prisma.programBeneficiary.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ approvalDate: expect.any(Date) }),
      }),
    );
  });

  it('preenche deliveryDate automaticamente ao marcar como entregue', async () => {
    ctx.prisma.programBeneficiary.findFirst.mockResolvedValue({
      id: BENEFICIARY_ID,
      producerId: PRODUCER_ID,
      status: ProgramBeneficiaryStatus.APPROVED,
      approvalDate: new Date('2026-01-01'),
      deliveryDate: null,
    });
    ctx.prisma.programBeneficiary.update.mockResolvedValue({
      id: BENEFICIARY_ID,
      status: ProgramBeneficiaryStatus.DELIVERED,
    });

    await ctx.service.update(MUNICIPALITY_A, PROGRAM_ID, BENEFICIARY_ID, {
      status: ProgramBeneficiaryStatus.DELIVERED,
    });

    expect(ctx.prisma.programBeneficiary.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ deliveryDate: expect.any(Date) }),
      }),
    );
  });

  it('nao sobrescreve approvalDate ja existente', async () => {
    const existingDate = new Date('2026-01-01');
    ctx.prisma.programBeneficiary.findFirst.mockResolvedValue({
      id: BENEFICIARY_ID,
      producerId: PRODUCER_ID,
      status: ProgramBeneficiaryStatus.APPROVED,
      approvalDate: existingDate,
      deliveryDate: null,
    });
    ctx.prisma.programBeneficiary.update.mockResolvedValue({
      id: BENEFICIARY_ID,
    });

    await ctx.service.update(MUNICIPALITY_A, PROGRAM_ID, BENEFICIARY_ID, {
      status: ProgramBeneficiaryStatus.APPROVED,
      value: 500,
    });

    expect(ctx.prisma.programBeneficiary.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ approvalDate: existingDate }),
      }),
    );
  });
});
