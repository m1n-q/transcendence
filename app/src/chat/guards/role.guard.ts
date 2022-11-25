import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { RmqError } from '../../common/rmq/types/rmq-error';
import { ChatRoomAdminPrivilege } from '../interfaces/chat-room-admin-privilege.interface';
import { ChatRoomOwnerPrivilege } from '../interfaces/chat-room-owner-privilege.interface';
import { ChatService } from '../services/chat.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly chatService: ChatService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!isRabbitContext(context))
      throw new RmqError({
        code: 400,
        message: 'Not RMQ request',
        where: 'chat-service',
      });

    const request = context.switchToRpc().getContext();
    const content: ChatRoomAdminPrivilege = JSON.parse(
      request.content.toString(),
    );
    if (!content['room_admin_id'] || !isUUID(content['room_admin_id']))
      throw new RmqError({
        code: 400,
        message: 'Invalid room_admin_id',
        where: 'chat-service',
      });
    if (
      !(await this.chatService.isAdmin(content.room_admin_id, content.room_id))
    )
      throw new RmqError({
        code: 401,
        message: 'need room-admin privilege',
        where: 'chat-service',
      });
    return true;
  }
}

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private readonly chatService: ChatService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!isRabbitContext(context))
      throw new RmqError({
        code: 400,
        message: 'Not RMQ request',
        where: 'chat-service',
      });

    const request = context.switchToRpc().getContext();
    const content: ChatRoomOwnerPrivilege = JSON.parse(
      request.content.toString(),
    );

    /* Guard precedes ValidatingPipe... */
    if (!content['room_owner_id'] || !isUUID(content['room_owner_id']))
      throw new RmqError({
        code: 400,
        message: 'Invalid room_owner_id',
        where: 'chat-service',
      });
    if (
      (await this.chatService.isOwner(
        content.room_owner_id,
        content.room_id,
      )) === false
    )
      throw new RmqError({
        code: 401,
        message: 'need room-owner privilege',
        where: 'chat-service',
      });
    return true;
  }
}
