import { UserInfo } from '../../auth/dto/user-info.dto';

export interface ChatMessageFormat {
  payload: string;
}

export class ChatMessageFromClient implements ChatMessageFormat {
  room: string;
  payload: string;
}

export class ChatMessageFromServer implements ChatMessageFormat {
  constructor(readonly sender: UserInfo, readonly payload: string) {}
}

export class ChatAnnouncementFromServer implements ChatMessageFormat {
  constructor(readonly payload: string) {}
}
