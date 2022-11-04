export class CreateUserDto {
  third_party_id: number;
  provider: string;
  nickname: string;
  '2FA': { type: string; key: string };
  prof_img: string;
}
