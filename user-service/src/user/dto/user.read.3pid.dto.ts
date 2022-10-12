import { IsString, IsNotEmpty } from 'class-validator';

export class User3piDDto {
  @IsNotEmpty()
  @IsString()
  thirdPartyId: string;

  @IsNotEmpty()
  @IsString()
  provider: string;
}
