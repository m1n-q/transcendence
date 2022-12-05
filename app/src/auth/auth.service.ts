import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { RmqError } from 'src/common/rmq-module/types/rmq-error';
import { RmqResponse } from 'src/common/rmq-module/types/rmq-response';
import { UserInfo } from '../user/types/user-info';

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
      throw new RmqError({
        code: 500,
        message: 'Request Time Out (to auth-service)',
        where: 'gameWebsocket',
      });
    }
    if (!response.success) throw response.error;
    return response.data;
  }
}
