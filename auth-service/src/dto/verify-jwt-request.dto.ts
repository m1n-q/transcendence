import { IsJWT } from 'class-validator';
export class VerifyJwtRequestDto {
  @IsJWT()
  access_token: string;
}
