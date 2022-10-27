import { AmqpResponse } from './../user/user.amqp.response.interface';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async verifyJwt(access_token: string) {
    const auth: AmqpResponse = await this.amqpConnection.request({
      exchange: 'auth.d.x',
      routingKey: 'auth.verify.jwt.rk',
      payload: {
        access_token,
      },
    });
    return auth;
  }
}
