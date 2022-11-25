import { UserInfo } from '../../auth/dto/user-info.dto';

export interface DMFormat {
  payload: string;
}

export class DMFromClient implements DMFormat {
  oppoName: string;
  payload: string;
}

export class DMFromServer implements DMFormat {
  constructor(readonly sender: UserInfo, readonly payload: string) {}
}
