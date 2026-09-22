import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateServiceTypeDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
