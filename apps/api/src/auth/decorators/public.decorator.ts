import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Libera uma rota do JwtAuthGuard global (ex: /health, /auth/login). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
