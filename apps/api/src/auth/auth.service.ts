import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { AuditAction, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { JwtPayload } from './types.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const DURATION_MULTIPLIERS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async login(
    email: string,
    password: string,
    ip?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.audit.log({
      municipalityId: user.municipalityId,
      userId: user.id,
      action: AuditAction.LOGIN,
      entity: 'User',
      entityId: user.id,
      ip,
      userAgent,
    });

    return this.issueTokenPair(user);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = this.verifyRefreshToken(refreshToken);
    const tokenHash = this.hashToken(refreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalido');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, status: 'ACTIVE' },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario inativo ou nao encontrado');
    }

    // Rotacao: revoga o token usado e emite um novo par a cada refresh.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { municipalityId: true } } },
    });

    if (!stored || stored.revokedAt) {
      return;
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    await this.audit.log({
      municipalityId: stored.user.municipalityId,
      userId: stored.userId,
      action: AuditAction.LOGOUT,
      entity: 'User',
      entityId: stored.userId,
    });
  }

  private async issueTokenPair(
    user: Pick<User, 'id' | 'email' | 'role' | 'municipalityId' | 'producerId'>,
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      municipalityId: user.municipalityId,
      producerId: user.producerId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>(
        'JWT_EXPIRES_IN',
        '1d',
      ) as JwtSignOptions['expiresIn'],
    });

    const refreshTokenTtl = this.config.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshTokenTtl as JwtSignOptions['expiresIn'],
    });

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: this.addDuration(new Date(), refreshTokenTtl),
      },
    });

    return { accessToken, refreshToken };
  }

  private verifyRefreshToken(refreshToken: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalido');
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Suporta formatos simples de duracao: "15m", "1h", "7d", "3600s". */
  private addDuration(date: Date, duration: string): Date {
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match) {
      throw new Error(`Formato de duracao invalido: ${duration}`);
    }

    const amount = Number(match[1]);
    const unit = match[2];
    return new Date(date.getTime() + amount * DURATION_MULTIPLIERS[unit]);
  }
}
