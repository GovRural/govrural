import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOwnProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  // Data URI (base64) da foto, ja redimensionada/comprimida pelo client
  // (ver ProfileDialog no frontend) - o limite aqui e so uma rede de
  // seguranca contra payloads absurdos, nao o controle de tamanho real.
  @IsOptional()
  @IsString()
  @MaxLength(500000)
  avatarUrl?: string;
}
