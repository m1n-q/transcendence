import { Expose } from 'class-transformer';

export class ThirdPartyInfoDto {
  @Expose()
  provider: string;
  @Expose()
  thirdPartyId: number;
}
