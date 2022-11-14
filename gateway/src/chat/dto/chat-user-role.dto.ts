import { Expose } from 'class-transformer';
import { IsEnum, IsString } from 'class-validator';

export enum ChatUserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export class ChatUserRoleDto {
  @Expose()
  @IsString()
  roomId: string;

  @Expose()
  @IsString()
  roomOwnerId: string;

  @Expose()
  @IsString()
  userId: string;

  @Expose()
  @IsEnum(ChatUserRole)
  role: ChatUserRole;
}
