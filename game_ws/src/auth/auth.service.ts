import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { RmqError } from '../common/rmq/types/rmq-error';
import { RmqResponse } from '../common/rmq/types/rmq-response';
import { UserInfo } from './dto/user-info.dto';

@Injectable()
export class AuthService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async verifyJwt(accessToken): Promise<UserInfo> {
    let response: RmqResponse<UserInfo>;
    try {
      response = await this.amqpConnection.request<RmqResponse<UserInfo>>({
        exchange: 'auth.d.x',
        routingKey: 'req.to.auth.verify.jwt.rk',
        payload: { access_token: accessToken },
      });
    } catch (e) {
      throw new RmqError(
        500,
        'Request Time Out (to auth-service)',
        'gameWebsocket',
      );
    }
    if (!response.success) throw response.error;
    return response.data;
  }
}
