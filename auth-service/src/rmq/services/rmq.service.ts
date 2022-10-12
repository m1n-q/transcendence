import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { RmqResponse } from '../../dto/rmq-response';
import { ThirdPartyInfoDto } from '../../dto/third-party-info.dto';
import { UserInfoDto } from '../../dto/user-info.dto';
import { RmqRequestFailedException } from './rmq-request-failed.exception';

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
      throw new RmqRequestFailedException('user-service');
    }
    return response;
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
      throw new RmqRequestFailedException('user-service');
    }
    return response;
  }
}
