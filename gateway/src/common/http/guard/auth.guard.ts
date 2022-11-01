import { access } from 'fs';
import { RmqResponse } from './../../rmq/types/rmq-response';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly amqpConnection: AmqpConnection) {}
  public async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { authorization } = request.headers;
    const access_token = authorization;

    if (access_token === undefined) {
      throw new HttpException('Token does not exist', 401);
    }

    const auth: RmqResponse = await this.amqpConnection.request({
      exchange: 'auth.d.x',
      routingKey: 'auth.verify.jwt.rk',
      payload: {
        access_token,
      },
    });
    if (auth.success === false) {
      throw new HttpException('Token does not exist', 401);
    }

    request.user = auth;
    return true;
  }
}
