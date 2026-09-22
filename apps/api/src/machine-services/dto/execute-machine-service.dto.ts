import {
  IsDateString,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// Campos que a secao 8.5 descreve como responsabilidade do operador de
// maquina: inicio, termino, horimetro, combustivel, observacoes.
export class ExecuteMachineServiceDto {
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  initialHourMeter?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  finalHourMeter?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fuelConsumption?: number;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
