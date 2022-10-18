import { IsNotEmpty, IsUUID } from 'class-validator';

export class RmqFriendRequest {
  @IsNotEmpty()
  @IsUUID()
  requester: string;

  @IsNotEmpty()
  @IsUUID()
  receiver: string;
}

export class RmqFriendRequestId {
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}

export class RmqBlockFriendRequest {
  @IsNotEmpty()
  @IsUUID()
  blocker: string;

  @IsNotEmpty()
  @IsUUID()
  blocked: string;
}
