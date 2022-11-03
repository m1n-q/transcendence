import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumberString,
  IsString,
  IsUrl,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class RmqUserIdDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;
}
export class RmqUserNicknameDto {
  @IsNotEmpty()
  @IsString()
  nickname: string;
}

export class RmqUser2FADto {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}

export class RmqUSer3pIDDto {
  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsNotEmpty()
  // @IsNumberString()
  thirdPartyId: string;
}

export class RmqUserCreateDto {
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
  @Type(() => RmqUser2FADto)
  '2FA': RmqUser2FADto;

  @IsNotEmpty()
  // @IsUrl()
  @IsString()
  profImg: string;
}
export class RmqUserUpdateNicknameDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsString()
  nickname: string;
}
