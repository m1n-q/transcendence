import { Expose, Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';

export class MessageType {
  sender: string;
  payload: string;
  created: string;
}

export class ChatRoomMessageDto {
  @Expose()
  @IsUUID()
  room_id: string;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => MessageType)
  message: MessageType[];
}
