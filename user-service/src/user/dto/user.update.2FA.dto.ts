import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class UserUpdate2FADto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsString()
  info: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}
