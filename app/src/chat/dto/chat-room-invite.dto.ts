import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class ChatRoomInviteDto {
  @Expose()
  @IsUUID()
  receiver_id: string;

  room_id: string;
  user_id: string;
}
