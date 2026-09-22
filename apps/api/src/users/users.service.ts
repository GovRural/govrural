import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditAction, Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { AuthenticatedUser } from '../auth/types.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(currentUser: AuthenticatedUser, dto: CreateUserDto) {
    const municipalityId = await this.resolveMunicipalityForCreate(
      currentUser,
      dto,
    );

    if (dto.departmentId) {
      await this.assertDepartmentBelongsToMunicipality(
        dto.departmentId,
        municipalityId,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          role: dto.role,
          phone: dto.phone,
          departmentId: dto.departmentId,
          municipalityId,
        },
      });

      await this.audit.log({
        municipalityId,
        userId: currentUser.id,
        action: AuditAction.CREATE,
        entity: 'User',
        entityId: user.id,
        newData: { ...user, passwordHash: undefined },
      });

      return this.sanitize(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ja existe um usuario com este email');
      }
      throw error;
    }
  }

  async findAll(currentUser: AuthenticatedUser) {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(currentUser.role === UserRole.SUPER_ADMIN
          ? {}
          : { municipalityId: currentUser.municipalityId }),
      },
      orderBy: { name: 'asc' },
    });

    return users.map((user) => this.sanitize(user));
  }

  async findOne(currentUser: AuthenticatedUser, id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(currentUser.role === UserRole.SUPER_ADMIN
          ? {}
          : { municipalityId: currentUser.municipalityId }),
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return this.sanitize(user);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateUserDto,
  ) {
    const existing = await this.findScopedOrThrow(currentUser, id);

    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      dto.role === UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Apenas SUPER_ADMIN pode conceder este perfil');
    }

    if (dto.departmentId) {
      await this.assertDepartmentBelongsToMunicipality(
        dto.departmentId,
        existing.municipalityId,
      );
    }

    const user = await this.prisma.user.update({
      where: { id: existing.id },
      data: {
        name: dto.name,
        role: dto.role,
        phone: dto.phone,
        departmentId: dto.departmentId,
        status: dto.status,
      },
    });

    await this.audit.log({
      municipalityId: existing.municipalityId,
      userId: currentUser.id,
      action: AuditAction.UPDATE,
      entity: 'User',
      entityId: user.id,
      oldData: { ...existing, passwordHash: undefined },
      newData: { ...user, passwordHash: undefined },
    });

    return this.sanitize(user);
  }

  async remove(currentUser: AuthenticatedUser, id: string) {
    const existing = await this.findScopedOrThrow(currentUser, id);

    if (existing.id === currentUser.id) {
      throw new BadRequestException('Nao e possivel remover o proprio usuario');
    }

    const user = await this.prisma.user.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    await this.audit.log({
      municipalityId: existing.municipalityId,
      userId: currentUser.id,
      action: AuditAction.DELETE,
      entity: 'User',
      entityId: user.id,
      oldData: { ...existing, passwordHash: undefined },
    });

    return this.sanitize(user);
  }

  async changePassword(
    currentUser: AuthenticatedUser,
    dto: ChangePasswordDto,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: currentUser.id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await this.audit.log({
      municipalityId: user.municipalityId,
      userId: user.id,
      action: AuditAction.UPDATE,
      entity: 'User',
      entityId: user.id,
      newData: { passwordChanged: true },
    });
  }

  private async findScopedOrThrow(currentUser: AuthenticatedUser, id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(currentUser.role === UserRole.SUPER_ADMIN
          ? {}
          : { municipalityId: currentUser.municipalityId }),
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return user;
  }

  private async resolveMunicipalityForCreate(
    currentUser: AuthenticatedUser,
    dto: CreateUserDto,
  ): Promise<string | null> {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (dto.role === UserRole.SUPER_ADMIN) {
        return null;
      }

      if (!dto.municipalityId) {
        throw new BadRequestException(
          'municipalityId e obrigatorio para este perfil',
        );
      }

      return dto.municipalityId;
    }

    // MUNICIPAL_ADMIN (unico outro perfil autorizado pelo controller):
    // nunca confia no municipalityId do body, sempre usa o do proprio token.
    if (dto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Apenas SUPER_ADMIN pode conceder este perfil');
    }

    if (!currentUser.municipalityId) {
      throw new BadRequestException('Usuario nao esta vinculado a um municipio');
    }

    return currentUser.municipalityId;
  }

  private async assertDepartmentBelongsToMunicipality(
    departmentId: string,
    municipalityId: string | null,
  ) {
    if (!municipalityId) {
      throw new BadRequestException(
        'Nao e possivel associar uma secretaria a um usuario sem municipio',
      );
    }

    const department = await this.prisma.department.findFirst({
      where: { id: departmentId, municipalityId },
    });

    if (!department) {
      throw new BadRequestException('Secretaria invalida para este municipio');
    }
  }

  private sanitize<T extends { passwordHash: string }>(
    user: T,
  ): Omit<T, 'passwordHash'> {
    const { passwordHash: _passwordHash, ...rest } = user;
    return rest;
  }
}
