import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumberString,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class RmqUserId {
  @IsNotEmpty()
  @IsUUID()
  id: string;
}

export class RmqUser2FA {
  @IsNotEmpty()
  @IsString()
  info: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}

export class RmqUSer3pID {
  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsNotEmpty()
  @IsNumberString()
  thirdPartyId: string;
}

export class RmqUserCreate {
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
  @Type(() => RmqUser2FA)
  '2FA': RmqUser2FA;

  @IsNotEmpty()
  @IsString()
  profImg: string;
}

export class RmqUserUpdate2FA {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsString()
  info: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}

export class RmqUserUpdateNickname {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsString()
  nickname: string;
}

export class RmqUserUpdateProfImg {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsString()
  profImg: string;
}
