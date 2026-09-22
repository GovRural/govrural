import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AuditLogInput {
  municipalityId?: string | null;
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  oldData?: Prisma.InputJsonValue | null;
  newData?: Prisma.InputJsonValue | null;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Registro de auditoria (secao 43). Nunca deve ser apagado por usuarios
 * comuns - nao expor um metodo de delete aqui.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        municipalityId: input.municipalityId ?? null,
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        oldData: input.oldData ?? undefined,
        newData: input.newData ?? undefined,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }
}
