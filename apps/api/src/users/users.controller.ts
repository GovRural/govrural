import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MUNICIPAL_ADMIN)
  create(@CurrentUser() currentUser: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.usersService.create(currentUser, dto);
  }

  @Get()
  findAll(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.findAll(currentUser);
  }

  @Get(':id')
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.findOne(currentUser, id);
  }

  @Patch('me/password')
  changeOwnPassword(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(currentUser, dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MUNICIPAL_ADMIN)
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MUNICIPAL_ADMIN)
  remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.remove(currentUser, id);
  }
}
