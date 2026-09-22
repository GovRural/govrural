import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { TenantId } from '../common/tenant/tenant-id.decorator.js';
import { TenantGuard } from '../common/tenant/tenant.guard.js';
import { MapQueryDto } from './dto/map-query.dto.js';
import { GisService } from './gis.service.js';

@Controller('gis')
@UseGuards(TenantGuard)
export class GisController {
  constructor(private readonly gisService: GisService) {}

  @Get('map')
  getMap(
    @TenantId() municipalityId: string,
    @Query() query: MapQueryDto,
  ) {
    return this.gisService.getMapFeatures(municipalityId, query.layers);
  }

  @Get('properties/:id')
  getPropertyDetail(
    @TenantId() municipalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.gisService.getPropertyDetail(municipalityId, id);
  }
}
