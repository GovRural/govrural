import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';

export const MAP_LAYERS = [
  'properties',
  'occurrences',
  'service-requests',
  'machine-services',
] as const;

export type MapLayer = (typeof MAP_LAYERS)[number];

export class MapQueryDto {
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsIn(MAP_LAYERS, { each: true })
  layers?: MapLayer[];
}
