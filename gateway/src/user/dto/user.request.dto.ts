import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl, ValidateNested } from 'class-validator';
import { TwoFactorAuthenticationInfo } from '../user-info';

export class CreateUserRequestDto {
  @IsNotEmpty()
  @IsString()
  third_party_id: string;

  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsNotEmpty()
  @IsString()
  nickname: string;

  @ValidateNested({ each: true })
  @Type(() => TwoFactorAuthenticationInfo)
  two_factor_info: TwoFactorAuthenticationInfo;

  @IsNotEmpty()
  @IsUrl()
  prof_img: string;
}
