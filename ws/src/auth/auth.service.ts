import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { RmqError } from '../common/rmq/types/rmq-error';
import { RmqResponse } from '../common/rmq/types/rmq-response';
import { UserInfoDto } from './dto/user-info.dto';

@Injectable()
export class AuthService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

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
