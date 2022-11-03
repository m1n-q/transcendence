import { IsNotEmpty, IsString } from 'class-validator';

export class TwoFactorAuthenticationInfo {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}

export class UserProfile {
  id: string;
  nickname: string;
  profImg: string;
  rankScore: number;
  createdDate: Date;
  deletedDate: Date;
}

export class UserInfo {
  id: string;
  nickname: string;
  provider: string;
  thirdPartyId: string;
  twoFactorAuthenticationKey: string;
  twoFactorAuthenticationInfo: string;
  profImg: string;
  rankScore: number;
  createdDate: Date;
  deletedDate: Date;
}
