import { IsString, IsNotEmpty } from 'class-validator';

export class TwoFactorAuthenticationDto {
  @IsNotEmpty()
  @IsString()
  info: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}
