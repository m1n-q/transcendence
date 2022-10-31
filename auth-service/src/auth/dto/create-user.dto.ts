export class CreateUserDto {
  thirdPartyId: string;
  provider: string;
  nickname: string;
  '2FA': { info: string; key: string };
  profImg: string;
}
