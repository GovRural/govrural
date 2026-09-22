import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMachineDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsString()
  @MaxLength(100)
  type!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  plate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @IsNumber()
  @Min(0)
  hourlyCost!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  fuelType?: string;
}
