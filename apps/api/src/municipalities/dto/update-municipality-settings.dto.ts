import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateMunicipalitySettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  departmentName?: string;

  @IsOptional()
  @IsUrl()
  faviconUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  institutionalMessage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  customDomain?: string;
}
