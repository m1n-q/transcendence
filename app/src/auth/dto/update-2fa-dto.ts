import { IsBoolean, IsInstance, IsNotEmpty, IsString } from 'class-validator';
import { UserInfo } from 'src/user/types/user-info';

export class UpdateTwoFactorAuthenticationDto {
  @IsString()
  @IsNotEmpty()
  twoFactorAuthenticationCode: string;

  @IsNotEmpty()
  @IsInstance(UserInfo)
  user: UserInfo;

  @IsBoolean()
  @IsNotEmpty()
  is_two_factor_authentication_enable: boolean;
}
