import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../../dto/create-user.dto';
import { RmqError } from '../../dto/rmq-error';
import { RmqResponse } from '../../dto/rmq-response';
import { ThirdPartyInfoDto } from '../../dto/third-party-info.dto';
import { UserInfoDto } from '../../dto/user-info.dto';

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
      throw new RmqError(408, 'Rmq Response Timeout', 'user-service');
    }
    if (!response.success) throw response.error;
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
      throw new RmqError(408, 'Rmq Response Timeout', 'user-service');
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
      throw new RmqError(408, 'Rmq Response Timeout', 'user-service');
    }
    if (!response.success) throw response.error;
    return response.data;
  }
}
