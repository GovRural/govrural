import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restringe uma rota aos perfis informados (ver secao 8). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
