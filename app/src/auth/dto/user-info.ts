import { Expose } from 'class-transformer';
import { IsUUID, IsAlphanumeric, IsUrl, IsPositive } from 'class-validator';

export class UserInfo {
  @Expose()
  @IsUUID()
  user_id: string;

  @Expose()
  @IsAlphanumeric()
  nickname: string;

  @Expose()
  @IsUrl()
  prof_img: string;

  @Expose()
  @IsPositive()
  mmr: number;
}
