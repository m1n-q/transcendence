import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class ChatRoomJoinDto {
  @Expose()
  @IsString()
  roomId: string;

  @Expose()
  @IsString()
  userId: string;

  @Expose()
  @IsString()
  roomPassword: string;
}
