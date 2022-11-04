import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../../auth/dto/create-user.dto';
import { RmqError } from '../../common/rmq/types/rmq-error';
import { RmqResponse } from '../../common/rmq/types/rmq-response';
import { ThirdPartyInfo } from '../../auth/dto/third-party-info';
import { UserInfo } from '../../auth/dto/user-info';

@Injectable()
export class UserService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  /* after get user's info by oauth provider */
  async requestUserInfoBy3pId(thirdPartyInfo: ThirdPartyInfo) {
    let response: RmqResponse<UserInfo>;

    try {
      response = await this.amqpConnection.request<RmqResponse<UserInfo>>({
        exchange: 'user.d.x',
        routingKey: 'req.to.user.read.by.3pId.rk',
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
    let response: RmqResponse<UserInfo>;

    try {
      response = await this.amqpConnection.request<RmqResponse<UserInfo>>({
        exchange: 'user.d.x',
        routingKey: 'req.to.user.read.by.id.rk',
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
    let response: RmqResponse<UserInfo>;

    try {
      response = await this.amqpConnection.request<RmqResponse<UserInfo>>({
        exchange: 'user.d.x',
        routingKey: 'req.to.user.create.rk',
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
