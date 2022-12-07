import { UpdateTwoFactorAuthenticationEnableDto } from './../../auth/dto/update-2fa-enable.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../../auth/dto/create-user.dto';
import { RmqError } from '../../common/rmq/types/rmq-error';
import { RmqResponse } from '../../common/rmq/types/rmq-response';
import { ThirdPartyInfo } from '../../auth/dto/third-party-info';
import { UserInfo } from '../types/user-info';
import { UpdateUserTwoFactorAuthenticationDto } from 'src/auth/dto/update-user-2fa-dto';
import { TwoFactorAuthenticationInfo } from '../types/two-factor-authentication-info';

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
  async updateUser2FAByID(data: UpdateUserTwoFactorAuthenticationDto) {
    let response: RmqResponse<TwoFactorAuthenticationInfo>;

    try {
      response = await this.amqpConnection.request<
        RmqResponse<TwoFactorAuthenticationInfo>
      >({
        exchange: 'user.d.x',
        routingKey: 'req.to.user.update.2FA.rk',
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

  async updateUser2FAEnableByID(data: UpdateTwoFactorAuthenticationEnableDto) {
    let response: RmqResponse;

    try {
      response = await this.amqpConnection.request<RmqResponse>({
        exchange: 'user.d.x',
        routingKey: 'req.to.user.update.2FA.enable.rk',
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

  async deleteUser2FAByID(data: { user_id: string }) {
    let response: RmqResponse;
    try {
      response = await this.amqpConnection.request<RmqResponse>({
        exchange: 'user.d.x',
        routingKey: 'req.to.user.delete.2FA.rk',
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
