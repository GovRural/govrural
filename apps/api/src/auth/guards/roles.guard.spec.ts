import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { RolesGuard } from './roles.guard.js';

function createContext(user?: { role: UserRole }): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => vi.fn(),
    getClass: () => vi.fn(),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('libera a rota quando nao ha @Roles() definido', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(undefined) };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(guard.canActivate(createContext({ role: UserRole.TECHNICIAN }))).toBe(
      true,
    );
  });

  it('libera quando o role do usuario esta na lista exigida', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([UserRole.SUPER_ADMIN]),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(
      guard.canActivate(createContext({ role: UserRole.SUPER_ADMIN })),
    ).toBe(true);
  });

  it('bloqueia quando o role do usuario nao esta na lista exigida', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([UserRole.SUPER_ADMIN]),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(() =>
      guard.canActivate(createContext({ role: UserRole.TECHNICIAN })),
    ).toThrow();
  });

  it('bloqueia quando nao ha usuario autenticado na requisicao', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([UserRole.SUPER_ADMIN]),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(() => guard.canActivate(createContext(undefined))).toThrow();
  });
});
