import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePropertyAreaDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsNumber()
  @Min(0)
  areaHectares!: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  activity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  crop?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  soilType?: string;

  @IsOptional()
  @IsBoolean()
  irrigation?: boolean;
}
