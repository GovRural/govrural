import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { AuthenticatedUser } from '../auth/types.js';
import { UsersService } from './users.service.js';

const MUNICIPALITY_A = '11111111-1111-1111-1111-111111111111';
const MUNICIPALITY_B = '22222222-2222-2222-2222-222222222222';

function buildService() {
  const prisma = {
    user: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    department: { findFirst: vi.fn() },
  };
  const audit = { log: vi.fn() };
  const service = new UsersService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
  );
  return { service, prisma, audit };
}

describe('UsersService (RBAC)', () => {
  let ctx: ReturnType<typeof buildService>;

  beforeEach(() => {
    ctx = buildService();
  });

  it('MUNICIPAL_ADMIN nao pode criar um SUPER_ADMIN', async () => {
    const currentUser: AuthenticatedUser = {
      id: 'admin-1',
      email: 'admin@a.gov',
      role: UserRole.MUNICIPAL_ADMIN,
      municipalityId: MUNICIPALITY_A,
    };

    await expect(
      ctx.service.create(currentUser, {
        name: 'Novo Super',
        email: 'novo@a.gov',
        password: 'senha1234',
        role: UserRole.SUPER_ADMIN,
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(ctx.prisma.user.create).not.toHaveBeenCalled();
  });

  it('MUNICIPAL_ADMIN sempre cria dentro do proprio municipio, mesmo se o body pedir outro', async () => {
    const currentUser: AuthenticatedUser = {
      id: 'admin-1',
      email: 'admin@a.gov',
      role: UserRole.MUNICIPAL_ADMIN,
      municipalityId: MUNICIPALITY_A,
    };

    ctx.prisma.user.create.mockResolvedValue({
      id: 'user-1',
      municipalityId: MUNICIPALITY_A,
      email: 'tecnico@a.gov',
      passwordHash: 'hash',
    });

    await ctx.service.create(currentUser, {
      name: 'Tecnico',
      email: 'tecnico@a.gov',
      password: 'senha1234',
      role: UserRole.TECHNICIAN,
      // tenta escalar para outro municipio - deve ser ignorado
      municipalityId: MUNICIPALITY_B,
    });

    expect(ctx.prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ municipalityId: MUNICIPALITY_A }),
      }),
    );
  });

  it('findAll de um usuario nao-SUPER_ADMIN sempre filtra pelo proprio municipio', async () => {
    const currentUser: AuthenticatedUser = {
      id: 'tec-1',
      email: 'tec@a.gov',
      role: UserRole.TECHNICIAN,
      municipalityId: MUNICIPALITY_A,
    };

    ctx.prisma.user.findMany.mockResolvedValue([]);

    await ctx.service.findAll(currentUser);

    expect(ctx.prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ municipalityId: MUNICIPALITY_A }),
      }),
    );
  });

  it('findAll de SUPER_ADMIN nao filtra por municipio', async () => {
    const currentUser: AuthenticatedUser = {
      id: 'super-1',
      email: 'super@govrural.local',
      role: UserRole.SUPER_ADMIN,
      municipalityId: null,
    };

    ctx.prisma.user.findMany.mockResolvedValue([]);

    await ctx.service.findAll(currentUser);

    const callArg = ctx.prisma.user.findMany.mock.calls[0][0];
    expect(callArg.where).not.toHaveProperty('municipalityId');
  });

  it('nunca retorna passwordHash nos dados sanitizados', async () => {
    const currentUser: AuthenticatedUser = {
      id: 'super-1',
      email: 'super@govrural.local',
      role: UserRole.SUPER_ADMIN,
      municipalityId: null,
    };

    ctx.prisma.user.findMany.mockResolvedValue([
      { id: 'u1', email: 'x@a.gov', passwordHash: 'super-secret-hash' },
    ]);

    const result = await ctx.service.findAll(currentUser);

    expect(result[0]).not.toHaveProperty('passwordHash');
  });
});
