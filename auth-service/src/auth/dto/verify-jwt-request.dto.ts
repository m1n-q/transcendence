import { IsJWT } from 'class-validator';
export class VerifyAccessJwtRequestDto {
  @IsJWT()
  access_token: string;
}

export class VerifyRefreshJwtRequestDto {
  @IsJWT()
  refresh_token: string;
}
