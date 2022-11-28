import { UserInfo } from '../../user/types/user-info';

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
