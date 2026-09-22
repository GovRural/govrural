import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { CreatePortalServiceRequestDto } from './dto/create-portal-service-request.dto.js';
import { PortalService } from './portal.service.js';

@Controller('portal')
@UseGuards(TenantGuard)
@Roles(UserRole.PRODUCER)
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getMe(user);
  }

  @Get('properties')
  getProperties(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getProperties(user);
  }

  @Get('service-requests')
  getServiceRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getServiceRequests(user);
  }

  @Post('service-requests')
  createServiceRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePortalServiceRequestDto,
  ) {
    return this.portalService.createServiceRequest(user, dto);
  }

  @Get('programs')
  getPrograms(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getPrograms(user);
  }
}
