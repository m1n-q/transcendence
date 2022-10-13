import { Expose } from 'class-transformer';
import { IsUUID, IsAlphanumeric, IsUrl, IsPositive } from 'class-validator';

export class UserInfoDto {
  @Expose()
  @IsUUID()
  userId: string;

  @Expose()
  @IsAlphanumeric()
  nickname: string;

  @Expose()
  @IsUrl()
  profImg: string;

  @Expose()
  @IsPositive()
  mmr: number;
}
