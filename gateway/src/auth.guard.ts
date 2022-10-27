import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { AmqpResponse } from './user/user.amqp.response.interface';
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

    if (authorization === undefined) {
      throw new HttpException('Token does not exist', 401);
    }

    const auth: AmqpResponse = await this.amqpConnection.request({
      exchange: 'auth.d.x',
      routingKey: 'auth.verify.jwt.rk',
      payload: {
        access_token: authorization,
      },
    });
    if (auth.success === false) {
      console.log(auth);
      throw new HttpException('Token does not exist', 401);
    }
    return true;
  }
}
