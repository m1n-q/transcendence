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
  twoFactorAuthenticationType: string;
  profImg: string;
  rankScore: number;
  createdDate: Date;
  deletedDate: Date;
}
