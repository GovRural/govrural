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
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreateMunicipalityDto } from './dto/create-municipality.dto.js';
import { UpdateMunicipalityDto } from './dto/update-municipality.dto.js';
import { UpdateMunicipalitySettingsDto } from './dto/update-municipality-settings.dto.js';
import { MunicipalitiesService } from './municipalities.service.js';

// Gestao de municipios e um recurso de plataforma (secao 8.1) - restrito ao
// Super Admin GovRural. RolesGuard e global (ver app.module.ts), so precisa
// do decorator @Roles() aqui. Um endpoint publico de branding (para a tela
// de login antes do usuario se autenticar) fica para quando o frontend de
// login/white-label for implementado.
@Controller('municipalities')
@Roles(UserRole.SUPER_ADMIN)
export class MunicipalitiesController {
  constructor(private readonly municipalitiesService: MunicipalitiesService) {}

  @Post()
  create(@Body() dto: CreateMunicipalityDto) {
    return this.municipalitiesService.create(dto);
  }

  @Get()
  findAll() {
    return this.municipalitiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.municipalitiesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMunicipalityDto,
  ) {
    return this.municipalitiesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.municipalitiesService.remove(id);
  }

  @Get(':id/settings')
  getSettings(@Param('id', ParseUUIDPipe) id: string) {
    return this.municipalitiesService.getSettings(id);
  }

  @Patch(':id/settings')
  updateSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMunicipalitySettingsDto,
  ) {
    return this.municipalitiesService.upsertSettings(id, dto);
  }
}
