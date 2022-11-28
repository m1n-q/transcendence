import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { RmqResponse } from '../common/rmq/types/rmq-response';

@Injectable()
export class AuthService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async requestSignIn(provider: string, code: string) {
    let response: RmqResponse<Tokens>;
    type Tokens = { access_token: string; refresh_token: string };
    try {
      response = await this.amqpConnection.request<RmqResponse<Tokens>>({
        exchange: process.env.RMQ_AUTH_DIRECT,
        routingKey: `req.to.auth.signin.${provider}.rk`,
        payload: { authorization_code: code },
      });
    } catch (reqFail) {
      throw new InternalServerErrorException('request to auth-service failed');
    }
    if (!response.success)
      throw new HttpException(
        `${response.error.message} / where: ${response.error.where}`,
        response.error.code,
      );
    return response.data;
  }

  async requestRefresh(token) {
    let response: RmqResponse<Tokens>;
    type Tokens = { access_token: string; refresh_token: string };
    try {
      response = await this.amqpConnection.request<RmqResponse<Tokens>>({
        exchange: process.env.RMQ_AUTH_DIRECT,
        routingKey: 'req.to.auth.refresh.jwt.rk',
        payload: { refresh_token: token },
      });
    } catch (reqFail) {
      throw new InternalServerErrorException('request to auth-service failed');
    }
    if (!response.success)
      throw new HttpException(
        `${response.error.message} / where: ${response.error.where}`,
        response.error.code,
      );
    return response.data;
  }
}
