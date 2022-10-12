import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { user2FADto } from './user.2FA.dto';
import { Type } from 'class-transformer';

export class UserCreateRequestDto {
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
  @Type(() => user2FADto)
  '2FA': user2FADto;

  @IsNotEmpty()
  @IsString()
  profImg: string;
}
