import { RmqResponse } from './../common/rmq/types/rmq-response';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RmqResponseUser } from './dto/user.response.dto';
import { UserInfo, UserProfile } from './user-info';

@Injectable()
export class UserService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async requestSignUp(data) {
    let response: RmqResponse;

    try {
      response = await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'rmq.to.user.create.rk',
        payload: data,
        timeout: 2000,
      });
    } catch (reqFail) {
      throw new InternalServerErrorException('request to user-serivce failed');
    }

    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return response.data;
  }

  async getUserByNickname(nickname: string): Promise<UserProfile> {
    let response: RmqResponse<UserProfile>;

    try {
      response = await this.amqpConnection.request<RmqResponse<UserProfile>>({
        exchange: 'user.d.x',
        routingKey: 'rmq.to.user.read.by.nickname.rk',
        payload: { nickname },
        timeout: 2000,
      });
    } catch (reqFail) {
      throw new InternalServerErrorException('request to user-serivce failed');
    }

    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return response.data;
  }

  async getUserById(user_id: string): Promise<UserInfo> {
    let response: RmqResponse<UserInfo>;

    try {
      response = await this.amqpConnection.request<RmqResponse<UserInfo>>({
        exchange: 'user.d.x',
        routingKey: 'rmq.to.user.read.by.id.rk',
        payload: { user_id },
        timeout: 2000,
      });
    } catch (reqFail) {
      throw new InternalServerErrorException('request to user-serivce failed');
    }

    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return response.data;
  }

  async deleteById(user_id: string) {
    let response;
    try {
      response = await this.amqpConnection.request<
        RmqResponse<RmqResponseUser>
      >({
        exchange: 'user.d.x',
        routingKey: 'rmq.to.user.delete.rk',
        payload: {
          user_id,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-serivce failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return;
  }

  async updateNicknameById(user_id: string, newNickname: string) {
    let response;
    try {
      response = await this.amqpConnection.request<
        RmqResponse<RmqResponseUser>
      >({
        exchange: 'user.d.x',
        routingKey: 'rmq.to.user.update.nickname.rk',
        payload: {
          user_id,
          nickname: newNickname,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-serivce failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return response.data;
  }

  //NOTE: nullable
  async updateProfImgById(user_id: string, newProfileImage: string) {
    let response;
    try {
      response = await this.amqpConnection.request<
        RmqResponse<RmqResponseUser>
      >({
        exchange: 'user.d.x',
        routingKey: 'rmq.to.user.update.profImg.rk',
        payload: {
          user_id,
          prof_img: newProfileImage,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-serivce failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return response.data;
  }

  //NOTE: nullable
  async updateTwoFactorAuthenticationById(
    user_id: string,
    newType: string,
    newKey: string,
  ) {
    let response;
    try {
      response = await this.amqpConnection.request<
        RmqResponse<RmqResponseUser>
      >({
        exchange: 'user.d.x',
        routingKey: 'rmq.to.user.update.2FA.rk',
        payload: {
          user_id,
          type: newType,
          key: newKey,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-serivce failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return response.data;
  }
}
