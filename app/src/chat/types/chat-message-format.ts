import { UserProfile } from '../../user/types/user-profile';

export interface ChatRoomMessage {
  room_msg_id: number;
  room_id: Date;
  sender_id: Date;
  payload: string;
  created: Date;
}

export interface ChatMessageFormat {
  message: ChatRoomMessage;
}

export class ChatMessageFromClient implements ChatMessageFormat {
  room: string;
  message: ChatRoomMessage;
}

export class ChatMessageFromServer implements ChatMessageFormat {
  constructor(
    readonly sender: UserProfile,
    readonly message: ChatRoomMessage,
  ) {}
}

export class ChatAnnouncementFromServer implements ChatMessageFormat {
  constructor(readonly message: ChatRoomMessage) {}
}
