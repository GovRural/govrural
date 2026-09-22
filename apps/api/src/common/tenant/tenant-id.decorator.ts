import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Le o municipality_id resolvido pelo TenantGuard.
 * So deve ser usado em rotas protegidas por @UseGuards(TenantGuard).
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { municipalityId: string }>();
    return request.municipalityId;
  },
);
