import { Expose } from 'class-transformer';
import { IsEnum, IsString, IsUUID } from 'class-validator';

export enum ChatRoomAccess {
  PUBLIC = 'public',
  PRIVATE = 'private',
  PROTECTED = 'protected',
}

export class ChatRoomCreationDto {
  @Expose()
  @IsString()
  roomName: string;

  @Expose()
  @IsUUID()
  roomOwnerId: string;

  @Expose()
  @IsEnum(ChatRoomAccess)
  roomAccess: ChatRoomAccess;

  @Expose()
  @IsString()
  roomPassword: string;
}
