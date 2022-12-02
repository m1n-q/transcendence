import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class ChatRoomInviteDto {
  @Expose()
  @IsUUID()
  room_id: string;

  user_id: string;
  receiver_id: string;
}
