import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl, ValidateNested } from 'class-validator';

export class TwoFactorAuthenticationDto {
  @IsNotEmpty()
  @IsString()
  info: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}

export class CreateUserRequestDto {
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
  @Type(() => TwoFactorAuthenticationDto)
  '2FA': TwoFactorAuthenticationDto;

  @IsNotEmpty()
  @IsUrl()
  profImg: string;
}
