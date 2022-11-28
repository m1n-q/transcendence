import { UserProfile } from '../../user/types/user-profile';

export interface ChatMessageFormat {
  payload: string;
}

export class ChatMessageFromClient implements ChatMessageFormat {
  room: string;
  payload: string;
}

export class ChatMessageFromServer implements ChatMessageFormat {
  constructor(readonly sender: UserProfile, readonly payload: string) {}
}

export class ChatAnnouncementFromServer implements ChatMessageFormat {
  constructor(readonly payload: string) {}
}
