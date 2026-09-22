import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class LinkProducerDto {
  @IsUUID()
  producerId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  relationshipType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}
