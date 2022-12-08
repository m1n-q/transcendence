import { Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';
import { TwoFactorAuthenticationInfo } from '../types/two-factor-authentication-info';

export class TwoFactorAuthenticationUpdateDto {
  @IsUUID()
  user_id: string;

  @ValidateNested()
  @Type(() => TwoFactorAuthenticationInfo)
  info: TwoFactorAuthenticationInfo;
}
