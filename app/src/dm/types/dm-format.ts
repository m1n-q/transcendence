import { UserInfo } from '../../user/types/user-info';

export interface DMFormat {
  payload: string;
}

export class DMFromClient implements DMFormat {
  opponent: string;
  payload: string;
}

export class DMFromServer implements DMFormat {
  constructor(readonly sender: UserInfo, readonly payload: string) {}
}
