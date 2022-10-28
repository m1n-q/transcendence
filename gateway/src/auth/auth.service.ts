import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { RmqError } from '../rmq-error';
import { RmqResponse } from '../rmq-response';

@Injectable()
export class AuthService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async requestSignIn(provider: string, code: string) {
    let response: RmqResponse<Tokens>;
    type Tokens = { access_token: string; refresh_token: string };

    try {
      response = await this.amqpConnection.request<RmqResponse<Tokens>>({
        exchange: 'auth.d.x',
        routingKey: `auth.signin.${provider}.rk`,
        payload: { code: code },
        timeout: 2000,
      });
    } catch (reqFail) {
      throw new RmqError(408, 'Rmq Response Timeout', 'auth-service');
    }

    if (!response.success) throw response.error;
    return response.data;
  }

  async requestSignUp(data) {
    let response: RmqResponse;

    try {
      response = await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.create.rk',
        payload: data,
        timeout: 2000,
      });
    } catch (reqFail) {
      console.log(reqFail);
      throw new RmqError(408, 'Rmq Response Timeout', 'auth-service');
    }

    if (!response.success) throw response.error;
    return response.data;
  }
}
