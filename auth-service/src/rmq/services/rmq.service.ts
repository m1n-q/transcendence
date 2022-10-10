import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
        exchange: 'user.direct.x',
        routingKey: 'user.read.by.3pId.q',
        payload: thirdPartyInfo,
        timeout: 2000,
      });
    } catch (e) {
      throw new InternalServerErrorException('RMQ request failed');
    }

    return response.success ? response.data : null; //NOTE: may use NotFoundException
  }

  async requestUserInfoById(userId: string) {
    let response: RmqResponse<UserInfoDto>;

    try {
      response = await this.amqpConnection.request<RmqResponse<UserInfoDto>>({
        exchange: 'user.direct.x',
        routingKey: 'user.read.by.id.q',
        payload: userId,
        timeout: 2000,
      });
    } catch (e) {
      throw new InternalServerErrorException('RMQ request failed');
    }
    return response.success ? response.data : null; //NOTE: may use NotFoundException
  }
}
