import { IsString, IsNotEmpty } from 'class-validator';

export class user2FADto {
  @IsNotEmpty()
  @IsString()
  info: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}
