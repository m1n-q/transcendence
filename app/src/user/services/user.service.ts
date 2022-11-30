import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RmqResponse } from '../../common/rmq/types/rmq-response';
import { UserProfile } from '../types/user-profile';

@Injectable()
export class UserService {
  constructor(private readonly amqpConnection: AmqpConnection) {}
  RK(type: 'req' | 'event', name: string) {
    return `${type === 'req' ? 'req.to' : 'event.from'}.${name}.rk`;
  }

  async requestToUserService(routingKey: string, payload) {
    let response: RmqResponse<any>;
    try {
      response = await this.amqpConnection.request<RmqResponse>({
        exchange: process.env.RMQ_USER_DIRECT,
        routingKey,
        payload,
      });
    } catch (reqFail) {
      throw new InternalServerErrorException('request to user-service failed');
    }
    if (!response.success)
      throw new HttpException(
        `${response.error.message} / where: ${response.error.where}`,
        response.error.code,
      );
    return response.data;
  }

  async getUserProfile(nickname: string): Promise<UserProfile> {
    return this.requestToUserService(this.RK('req', 'user.read.by.nickname'), {
      nickname,
    });
  }

  async getFriends(userId: string): Promise<UserProfile[]> {
    return this.requestToUserService(this.RK('req', 'user.read.friend.rk'), {
      userId,
    });
  }
}
