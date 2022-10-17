import { IsString, IsNotEmpty } from 'class-validator';

export class User3pIdDto {
  @IsNotEmpty()
  @IsString()
  thirdPartyId: string;

  @IsNotEmpty()
  @IsString()
  provider: string;
}
