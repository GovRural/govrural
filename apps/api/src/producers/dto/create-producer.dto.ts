import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ProducerType } from '@prisma/client';

const normalizeDigits = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/\D/g, '') : value;

export class CreateProducerDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @Transform(normalizeDigits)
  @IsString()
  @Matches(/^\d{11}$|^\d{14}$/, {
    message: 'cpfCnpj deve conter 11 (CPF) ou 14 (CNPJ) digitos',
  })
  cpfCnpj!: string;

  @IsEnum(ProducerType)
  producerType!: ProducerType;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ruralRegistration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  stateRegistration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  carNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cafNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  association?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cooperative?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
