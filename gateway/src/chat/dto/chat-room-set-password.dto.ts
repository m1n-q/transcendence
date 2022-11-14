import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class ChatRoomSetPasswordDto {
  @Expose()
  @IsString()
  roomId: string;

  @Expose()
  @IsString()
  roomOwnerId: string;

  @Expose()
  @IsString()
  roomPassword: string;
}
