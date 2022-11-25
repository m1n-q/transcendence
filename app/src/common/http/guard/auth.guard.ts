import { access } from 'fs';
import { RmqResponse } from './../../rmq/types/rmq-response';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import { RmqError } from '../../rmq/types/rmq-error';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly amqpConnection: AmqpConnection) {}
  public async canActivate(context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();
    const { authorization } = request.headers;
    if (!authorization) throw new HttpException('Unauthorized', 401);

    const bearerToken = authorization.split(' ');
    if (bearerToken.length !== 2 || bearerToken[0] !== 'Bearer')
      throw new HttpException('Unauthorized', 401);

    const access_token = bearerToken[1];
    let response;
    try {
      response = await this.amqpConnection.request<RmqResponse>({
        exchange: 'auth.d.x',
        routingKey: 'req.to.auth.verify.jwt.rk',
        payload: {
          access_token,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to auth-service failed');
    }

    if (response.success === false)
      throw new HttpException(response.error.message, response.error.code);

    request['user'] = response.data;
    return true;
  }
}
