import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
