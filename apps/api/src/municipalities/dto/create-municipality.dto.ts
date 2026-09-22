import {
  IsEmail,
  IsHexColor,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateMunicipalityDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @Length(2, 2)
  state!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ibgeCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cnpj?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}
