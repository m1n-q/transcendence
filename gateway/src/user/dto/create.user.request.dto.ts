import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { TwoFactorAuthenticationDto } from './twoFactorAuthentication.dto';
import { Type } from 'class-transformer';

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
  @IsString()
  profImg: string;
}
