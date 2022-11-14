import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class ChatRoomUserDto {
  @Expose()
  @IsUUID()
  roomId: string;

  @Expose()
  @IsUUID()
  userId: string;
}
