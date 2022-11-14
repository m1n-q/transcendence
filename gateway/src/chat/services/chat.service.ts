import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { RmqResponse } from '../../common/rmq/types/rmq-response';
import { ChatRoomCreationDto } from '../dto/chat-room-creation.dto';
import { ChatRoomJoinDto } from '../dto/chat-room-join.dto';
import { ChatRoomMessageDto } from '../dto/chat-room-message.dto';
import { ChatRoomPenaltyDto } from '../dto/chat-room-penalty.dto';
import { ChatRoomSetPasswordDto } from '../dto/chat-room-set-password.dto';
import { ChatRoomUserDto } from '../dto/chat-room-user.dto';
import { ChatUserRoleDto } from '../dto/chat-user-role.dto';

@Injectable()
export class ChatService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  RK(type: 'req' | 'event', name: string) {
    return `${type === 'req' ? 'req.to' : 'event.from'}.${name}.rk`;
  }

  async requestToChatService(routingKey, payload) {
    let response: RmqResponse;
    try {
      response = await this.amqpConnection.request<RmqResponse>({
        exchange: 'chat.d.x',
        routingKey,
        payload,
      });
    } catch (reqFail) {
      throw new InternalServerErrorException('request to chat-service failed');
    }
    if (!response.success)
      throw new HttpException(
        `${response.error.message} / where: ${response.error.where}`,
        response.error.code,
      );
    return response.data;
  }

  async createRoom(chatRoomCreationDto: ChatRoomCreationDto) {
    return this.requestToChatService(
      this.RK('req', 'chat.create.room'),
      chatRoomCreationDto,
    );
  }

  async deleteRoom(roomId: string) {
    return this.requestToChatService(
      this.RK('req', 'chat.delete.room'),
      roomId,
    );
  }

  async joinRoom(chatRoomJoinDto: ChatRoomJoinDto) {
    return this.requestToChatService(
      this.RK('req', 'chat.join.room'),
      chatRoomJoinDto,
    );
  }

  async exitRoom(chatRoomUserDto: ChatRoomUserDto) {
    return this.requestToChatService(
      this.RK('req', 'chat.exit.room'),
      chatRoomUserDto,
    );
  }

  async setRoomPassword(chatRoomSetPasswordDto: ChatRoomSetPasswordDto) {
    return this.requestToChatService(
      this.RK('req', 'chat.set.room.password'),
      chatRoomSetPasswordDto,
    );
  }

  async setRole(chatUserRoleDto: ChatUserRoleDto) {
    return this.requestToChatService(
      this.RK('req', 'chat.set.user.role'),
      chatUserRoleDto,
    );
  }

  async banUser(chatRoomPenaltyDto: ChatRoomPenaltyDto) {
    return this.requestToChatService(
      this.RK('req', 'chat.ban.user'),
      chatRoomPenaltyDto,
    );
  }

  async unbanUser(chatRoomPenaltyDto: ChatRoomPenaltyDto) {
    return this.requestToChatService(
      this.RK('req', 'chat.unban.user'),
      chatRoomPenaltyDto,
    );
  }

  async muteUser(chatRoomPenaltyDto: ChatRoomPenaltyDto) {
    return this.requestToChatService(
      this.RK('req', 'chat.mute.user'),
      chatRoomPenaltyDto,
    );
  }

  async unmuteUser(chatRoomPenaltyDto: ChatRoomPenaltyDto) {
    return this.requestToChatService(
      this.RK('req', 'chat.unmute.user'),
      chatRoomPenaltyDto,
    );
  }

  async storeMessages(chatRoomMessageDto: ChatRoomMessageDto) {
    return this.requestToChatService(
      this.RK('req', 'chat.store.messages'),
      chatRoomMessageDto,
    );
  }

  async getAllMessages(roomId: string) {
    return this.requestToChatService(
      this.RK('req', 'chat.get.all.messages'),
      roomId,
    );
  }
}
