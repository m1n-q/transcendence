import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { RmqError } from './types/rmq-error';
import { RmqResponse } from './types/rmq-response';
import { UserInfoDto } from '../../auth/dto/user-info.dto';

@Injectable()
export class RmqService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  sendMessage(exchange, rk, payload) {
    payload['created'] = new Date();
    this.amqpConnection.publish(exchange, rk, payload);
  }

  async verifyJwt(accessToken) {
    let response: RmqResponse<UserInfoDto>;
    try {
      response = await this.amqpConnection.request<RmqResponse<UserInfoDto>>({
        exchange: 'auth.d.x',
        routingKey: 'auth.verify.jwt.rk',
        payload: { access_token: accessToken },
      });
    } catch (e) {
      throw new RmqError(
        408,
        'Request Time Out (to auth-serivice)',
        'Websocket',
      );
    }
    if (!response.success) throw response.error;
    return response.data;
  }
}
