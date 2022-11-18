import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class MessageType {
  sender_id: string;
  payload: string;
  created: string;
}

export class ChatRoomMessageDto {
  room_id: string;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => MessageType)
  messages: MessageType[];
}
