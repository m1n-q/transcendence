import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { RmqResponse } from '../../common/rmq/types/rmq-response';
import { ChatRoomMessageDto } from '../dto/chat-room-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  RK(type: 'req' | 'event', name: string) {
    return `${type === 'req' ? 'req.to' : 'event.from'}.${name}.rk`;
  }

  async requestToChatService(routingKey: string, payload) {
    let response: RmqResponse;
    try {
      response = await this.amqpConnection.request<RmqResponse>({
        exchange: process.env.RMQ_CHAT_DIRECT,
        routingKey,
        payload,
      });
    } catch (reqFail) {
      throw new InternalServerErrorException('request to chat-service failed');
    }
    if (!response.success) throw response.error;
    return response.data;
  }

  async storeRoomMessage(chatRoomMessageDto: ChatRoomMessageDto) {
    return this.requestToChatService(
      this.RK('req', 'chat.store.room.message'),
      chatRoomMessageDto,
    );
  }
}
