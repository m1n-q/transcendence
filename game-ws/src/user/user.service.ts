import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { RmqError } from '../common/rmq/types/rmq-error';
import { RmqResponse } from '../common/rmq/types/rmq-response';
import { UserProfile } from './dto/user-info.dto';

@Injectable()
export class UserService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async readUserByNickname(nickname): Promise<UserProfile> {
    let response: RmqResponse<UserProfile>;
    try {
      response = await this.amqpConnection.request<RmqResponse<UserProfile>>({
        exchange: 'user.d.x',
        routingKey: 'req.to.user.read.by.nickname.rk',
        payload: { nickname },
      });
    } catch (e) {
      throw new RmqError(
        500,
        'Request Time Out (to user-service)',
        'gameWebsocket',
      );
    }
    if (!response.success) throw response.error;
    return response.data;
  }

  async updateUserMmrById(user_id, mmr) {
    let response;
    try {
      response = await this.amqpConnection.request<RmqResponse>({
        exchange: 'user.d.x',
        routingKey: 'req.to.user.update.mmr.rk',
        payload: { user_id, mmr },
      });
    } catch (e) {
      throw new RmqError(
        500,
        'Request Time Out (to user-service)',
        'gameWebsocket',
      );
    }
    if (!response.success) throw response.error;
    return response.data;
  }
}
