import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { MapLayer } from './dto/map-query.dto.js';

export interface GeoJsonFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: Record<string, unknown>;
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

function point(
  lat: number,
  lng: number,
  properties: Record<string, unknown>,
): GeoJsonFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties,
  };
}

/**
 * Camada geografica (ver secao 30-31). O poligono completo de cada
 * propriedade (PostGIS geometry) fica para quando dados reais de CAR/
 * shapefile forem importados - por ora agregamos os pontos de referencia
 * (latitude/longitude) ja existentes em cada entidade num GeoJSON.
 */
@Injectable()
export class GisService {
  constructor(private readonly prisma: PrismaService) {}

  async getMapFeatures(
    municipalityId: string,
    layers?: MapLayer[],
  ): Promise<GeoJsonFeatureCollection> {
    const wanted = new Set(
      layers ?? ['properties', 'occurrences', 'service-requests', 'machine-services'],
    );
    const features: GeoJsonFeature[] = [];

    if (wanted.has('properties')) {
      const properties = await this.prisma.ruralProperty.findMany({
        where: {
          municipalityId,
          deletedAt: null,
          latitude: { not: null },
          longitude: { not: null },
        },
        select: { id: true, name: true, latitude: true, longitude: true, status: true },
      });
      for (const p of properties) {
        features.push(
          point(p.latitude!, p.longitude!, {
            layer: 'property',
            id: p.id,
            label: p.name,
            status: p.status,
          }),
        );
      }
    }

    if (wanted.has('occurrences')) {
      const occurrences = await this.prisma.ruralOccurrence.findMany({
        where: { municipalityId, latitude: { not: null }, longitude: { not: null } },
        select: {
          id: true,
          title: true,
          type: true,
          priority: true,
          status: true,
          latitude: true,
          longitude: true,
        },
      });
      for (const o of occurrences) {
        features.push(
          point(o.latitude!, o.longitude!, {
            layer: 'occurrence',
            id: o.id,
            label: o.title,
            type: o.type,
            priority: o.priority,
            status: o.status,
          }),
        );
      }
    }

    if (wanted.has('service-requests')) {
      const requests = await this.prisma.serviceRequest.findMany({
        where: { municipalityId, latitude: { not: null }, longitude: { not: null } },
        select: {
          id: true,
          protocol: true,
          status: true,
          priority: true,
          latitude: true,
          longitude: true,
        },
      });
      for (const r of requests) {
        features.push(
          point(r.latitude!, r.longitude!, {
            layer: 'service_request',
            id: r.id,
            label: r.protocol,
            status: r.status,
            priority: r.priority,
          }),
        );
      }
    }

    if (wanted.has('machine-services')) {
      const services = await this.prisma.machineService.findMany({
        where: { municipalityId, latitude: { not: null }, longitude: { not: null } },
        select: {
          id: true,
          serviceType: true,
          status: true,
          latitude: true,
          longitude: true,
        },
      });
      for (const s of services) {
        features.push(
          point(s.latitude!, s.longitude!, {
            layer: 'machine_service',
            id: s.id,
            label: s.serviceType,
            status: s.status,
          }),
        );
      }
    }

    return { type: 'FeatureCollection', features };
  }

  /**
   * Detalhe agregado ao clicar em uma propriedade (ver secao 30):
   * produtores vinculados, talhoes, solicitacoes, servicos de maquina e
   * programas recebidos pelos produtores vinculados a esta propriedade.
   */
  async getPropertyDetail(municipalityId: string, propertyId: string) {
    const property = await this.prisma.ruralProperty.findFirst({
      where: { id: propertyId, municipalityId, deletedAt: null },
      include: {
        producerLinks: {
          where: { endDate: null },
          include: { producer: true },
        },
        areas: { where: { deletedAt: null } },
      },
    });

    if (!property) {
      throw new NotFoundException('Propriedade nao encontrada');
    }

    const producerIds = property.producerLinks.map((link) => link.producerId);

    const [serviceRequests, machineServices, programBenefits] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where: { propertyId: property.id },
        orderBy: { requestedAt: 'desc' },
        take: 20,
      }),
      this.prisma.machineService.findMany({
        where: { propertyId: property.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      producerIds.length > 0
        ? this.prisma.programBeneficiary.findMany({
            where: { producerId: { in: producerIds } },
            include: { program: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
          })
        : Promise.resolve([]),
    ]);

    return {
      property,
      producers: property.producerLinks.map((link) => link.producer),
      areas: property.areas,
      serviceRequests,
      machineServices,
      programBenefits,
    };
  }
}
