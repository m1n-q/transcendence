import { IsBoolean, IsInstance, IsNotEmpty, IsString } from 'class-validator';
import { UserInfo } from 'src/user/types/user-info';

export class DeleteTwoFactorAuthenticationDto {
  @IsString()
  @IsNotEmpty()
  twoFactorAuthenticationCode: string;

  @IsNotEmpty()
  @IsInstance(UserInfo)
  user: UserInfo;
}
