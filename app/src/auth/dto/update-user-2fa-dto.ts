import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UpdateUserTwoFactorAuthenticationDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  key: string;
}
