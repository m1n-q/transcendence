import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../../auth/dto/create-user.dto';
import { RmqError } from './types/rmq-error';
import { RmqResponse } from './types/rmq-response';
import { ThirdPartyInfoDto } from '../../auth/dto/third-party-info.dto';
import { UserInfoDto } from '../../auth/dto/user-info.dto';

@Injectable()
export class RmqService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  /* after get user's info by oauth provider */
  async requestUserInfoBy3pId(thirdPartyInfo: ThirdPartyInfoDto) {
    let response: RmqResponse<UserInfoDto>;

    try {
      response = await this.amqpConnection.request<RmqResponse<UserInfoDto>>({
        exchange: 'user.d.x',
        routingKey: 'user.read.by.3pId.rk',
        payload: thirdPartyInfo,
        timeout: 2000,
      });
    } catch (reqFail) {
      throw new RmqError({
        code: 408,
        message: 'Rmq Response Timeout',
        where: 'user-service',
      });
    }

    if (!response.success) throw new RmqError(response.error);
    return response.data;
  }

  async requestUserInfoById(userId: string) {
    let response: RmqResponse<UserInfoDto>;

    try {
      response = await this.amqpConnection.request<RmqResponse<UserInfoDto>>({
        exchange: 'user.d.x',
        routingKey: 'user.read.by.id.rk',
        payload: userId,
        timeout: 2000,
      });
    } catch (reqFail) {
      throw new RmqError({
        code: 408,
        message: 'Rmq Response Timeout',
        where: 'user-service',
      });
    }
    if (!response.success) throw response.error;
    return response.data;
  }

  async requestCreateUser(data: CreateUserDto) {
    let response: RmqResponse<UserInfoDto>;

    try {
      response = await this.amqpConnection.request<RmqResponse<UserInfoDto>>({
        exchange: 'user.d.x',
        routingKey: 'user.create.rk',
        payload: data,
        timeout: 2000,
      });
    } catch (reqFail) {
      throw new RmqError({
        code: 408,
        message: 'Rmq Response Timeout',
        where: 'user-service',
      });
    }
    if (!response.success) throw response.error;
    return response.data;
  }
}
