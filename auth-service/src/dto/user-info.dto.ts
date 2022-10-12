import { IsUUID, IsAlphanumeric, IsUrl, IsPositive } from 'class-validator';

export class UserInfoDto {
  @IsUUID()
  userId: string;

  @IsAlphanumeric()
  nickname: string;

  @IsUrl()
  profImg: string;

  @IsPositive()
  mmr: number;
}
