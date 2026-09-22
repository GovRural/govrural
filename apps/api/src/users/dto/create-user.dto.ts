import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  // Apenas SUPER_ADMIN pode definir isto; para os demais o service forca o
  // municipalityId do proprio usuario autenticado.
  @IsOptional()
  @IsUUID()
  municipalityId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  // Obrigatorio quando role === PRODUCER (portal do produtor, secao 32);
  // ignorado para os demais perfis.
  @IsOptional()
  @IsUUID()
  producerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
