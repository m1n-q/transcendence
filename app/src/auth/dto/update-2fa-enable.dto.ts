import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateTwoFactorAuthenticationEnableDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsBoolean()
  @IsNotEmpty()
  is_two_factor_authentication_enable: boolean;
}
