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
        routingKey: 'user.create.rk',
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

  async getUserByNickname(nickname): Promise<UserProfile> {
    let response: RmqResponse<UserProfile>;

    try {
      response = await this.amqpConnection.request<RmqResponse<UserProfile>>({
        exchange: 'user.d.x',
        routingKey: 'user.read.by.nickname.rk',
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

  async getUserById(id): Promise<UserInfo> {
    let response: RmqResponse<UserInfo>;

    try {
      response = await this.amqpConnection.request<RmqResponse<UserInfo>>({
        exchange: 'user.d.x',
        routingKey: 'user.read.by.id.rk',
        payload: { id },
        timeout: 2000,
      });
    } catch (reqFail) {
      throw new InternalServerErrorException('request to user-serivce failed');
    }

    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return response.data;
  }

  async deleteById(id: string) {
    let response;
    try {
      response = await this.amqpConnection.request<
        RmqResponse<RmqResponseUser>
      >({
        exchange: 'user.d.x',
        routingKey: 'user.delete.rk',
        payload: {
          id: id,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-serivce failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return;
  }

  async updateNicknameById(id: string, newNickname: string) {
    let response;
    try {
      response = await this.amqpConnection.request<
        RmqResponse<RmqResponseUser>
      >({
        exchange: 'user.d.x',
        routingKey: 'user.update.nickname.rk',
        payload: {
          id: id,
          nickname: newNickname,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-serivce failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return;
  }

  //NOTE: nullable
  async updateProfImgById(id: string, newProfileImage: string) {
    let response;
    try {
      response = await this.amqpConnection.request<
        RmqResponse<RmqResponseUser>
      >({
        exchange: 'user.d.x',
        routingKey: 'user.update.profImg.rk',
        payload: {
          id: id,
          nickname: newProfileImage,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-serivce failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return;
  }

  //NOTE: nullable
  async updateTwoFactorAuthenticationById(
    id: string,
    newType: string,
    newKey: string,
  ) {
    let response;
    try {
      response = await this.amqpConnection.request<
        RmqResponse<RmqResponseUser>
      >({
        exchange: 'user.d.x',
        routingKey: 'user.update.2FA.rk',
        payload: {
          id: id,
          type: newType,
          key: newKey,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-serivce failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return;
  }
}
