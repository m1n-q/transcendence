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
  user_id: string;
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
  third_party_id: string;
}

export class RmqUserCreateDto {
  @IsNotEmpty()
  // @IsString()
  third_party_id: string;

  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsNotEmpty()
  @IsString()
  nickname: string;

  @ValidateNested({ each: true })
  @Type(() => RmqUser2FADto)
  '2FA': RmqUser2FADto;

  // @IsNotEmpty()
  // @IsUrl()
  // @IsString()
  prof_img: string;
}
export class RmqUserUpdateNicknameDto {
  @IsNotEmpty()
  @IsUUID()
  user_id: string;

  @IsNotEmpty()
  @IsString()
  nickname: string;
}
