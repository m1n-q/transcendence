import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl, ValidateNested } from 'class-validator';

export class TwoFactorAuthentication {
  @IsNotEmpty()
  @IsString()
  info: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}

export class CreateUserRequest {
  @IsNotEmpty()
  @IsString()
  thirdPartyId: string;

  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsNotEmpty()
  @IsString()
  nickname: string;

  @ValidateNested({ each: true })
  @Type(() => TwoFactorAuthentication)
  '2FA': TwoFactorAuthentication;

  @IsNotEmpty()
  @IsUrl()
  profImg: string;
}
