export interface DMFormat {
  payload: string;
}

export class DMFromClient implements DMFormat {
  opponent: string;
  payload: string;
}

export class DMFromServer implements DMFormat {
  constructor(readonly sender, readonly payload: string) {}
}
