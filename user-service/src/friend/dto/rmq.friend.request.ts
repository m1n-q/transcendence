import { IsNotEmpty, IsUUID } from 'class-validator';

export class RmqRequestFriend {
  @IsNotEmpty()
  @IsUUID()
  requester: string;

  @IsNotEmpty()
  @IsUUID()
  receiver: string;
}

export class RmqRequestFriendId {
  @IsNotEmpty()
  @IsUUID()
  user_id: string;
}

export class RmqRequestBlockFriend {
  @IsNotEmpty()
  @IsUUID()
  blocker: string;

  @IsNotEmpty()
  @IsUUID()
  blocked: string;
}
