import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthenticatedUser } from '../../auth/types.js';
import { PrismaService } from '../prisma/prisma.service.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const TENANT_HEADER = 'x-municipality-id';

/**
 * Resolve e valida o tenant (Municipality) da requisicao.
 *
 * - Usuarios normais: o tenant e sempre o municipalityId do proprio JWT
 *   (JwtAuthGuard deve rodar antes deste guard). Nunca confia em header
 *   enviado pelo client para esses usuarios - evitaria acesso a outro tenant.
 * - SUPER_ADMIN: nao pertence a nenhum municipio, entao precisa informar
 *   qual municipio esta operando via header `x-municipality-id`.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser; municipalityId: string }>();

    const municipalityId =
      request.user.role === UserRole.SUPER_ADMIN
        ? this.resolveFromHeader(request)
        : request.user.municipalityId;

    if (!municipalityId) {
      throw new BadRequestException('Usuario nao esta vinculado a um municipio');
    }

    const municipality = await this.prisma.municipality.findFirst({
      where: { id: municipalityId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!municipality) {
      throw new NotFoundException('Municipio nao encontrado');
    }

    if (municipality.status !== 'ACTIVE') {
      throw new BadRequestException('Municipio inativo');
    }

    request.municipalityId = municipality.id;

    return true;
  }

  private resolveFromHeader(request: Request): string {
    const header = request.headers[TENANT_HEADER];

    if (!header || typeof header !== 'string') {
      throw new BadRequestException(`Header "${TENANT_HEADER}" e obrigatorio`);
    }

    if (!UUID_REGEX.test(header)) {
      throw new BadRequestException(`Header "${TENANT_HEADER}" invalido`);
    }

    return header;
  }
}
