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
  user_id: string;
  nickname: string;
  prof_img: string;
  mmr: number;
  created: Date;
  deleted: Date;
}

export class UserInfo {
  user_id: string;
  nickname: string;
  provider: string;
  third_party_id: string;
  two_factor_authentication_key: string;
  two_factor_authentication_type: string;
  prof_img: string;
  mmr: number;
  created: Date;
  deleted: Date;
}
