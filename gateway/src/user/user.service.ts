import { RmqResponse } from './../common/rmq/types/rmq-response';
import { CreateUserRequest } from './dto/user.request.dto';
import { HttpException, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RmqResponseUser } from './dto/user.response.dto';

@Injectable()
export class UserService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async join(body: CreateUserRequest) {
    const response: RmqResponse<RmqResponseUser> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.create.rk',
        payload: {
          thirdPartyId: body.thirdPartyId,
          provider: body.provider,
          nickname: body.nickname,
          '2FA': body['2FA'],
          profImg: body.profImg,
        },
      });
    if (!response.success) throw new HttpException(response.error, 500);
    return response;
  }

  async getById(id: string) {
    const response: RmqResponse<RmqResponseUser> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.read.by.id.rk',
        payload: {
          id: id,
        },
      });

    if (!response.success) throw new HttpException(response.error, 500);
    return response;
  }

  async deleteById(id: string) {
    const response: RmqResponse<RmqResponseUser> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.delete.rk',
        payload: {
          id: id,
        },
      });
    if (!response.success) throw new HttpException(response.error, 500);
  }

  async getNicknameById(id: string) {
    const response: RmqResponse<RmqResponseUser> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.read.by.id.rk',
        payload: {
          id: id,
        },
      });
    if (!response.success) throw new HttpException(response.error, 500);
    return response.data.nickname;
  }

  async getUserByNickname(nickname: string) {
    const response: RmqResponse<RmqResponseUser> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.read.by.nickname.rk',
        payload: {
          nickname,
        },
      });
    if (!response.success) throw new HttpException(response.error, 500);
    return response.data;
  }

  async updateNicknameById(id: string, newNickname: string) {
    const response: RmqResponse<RmqResponseUser> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.update.nickname.rk',
        payload: {
          id: id,
          nickname: newNickname,
        },
      });
    if (!response.success) throw new HttpException(response.error, 500);
  }

  async getProfImgById(id: string) {
    const response: RmqResponse<RmqResponseUser> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.read.by.id.rk',
        payload: {
          id: id,
        },
      });
    if (!response.success) throw new HttpException(response.error, 500);
    return response.data.profImg;
  }

  async updateProfImgById(id: string, newProfileImage: string) {
    const response: RmqResponse<RmqResponseUser> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.update.profImg.rk',
        payload: {
          id: id,
          profImg: newProfileImage,
        },
      });
    if (!response.success) throw new HttpException(response.error, 500);
  }

  async getTwoFactorAuthenticationById(id: string) {
    const response: RmqResponse<RmqResponseUser> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.read.by.id.rk',
        payload: {
          id: id,
        },
      });
    if (!response.success) throw new HttpException(response.error, 500);

    return {
      info: response.data.twoFactorAuthenticationInfo,
      key: response.data.twoFactorAuthenticationKey,
    };
  }

  async updateTwoFactorAuthenticationById(
    id: string,
    newInfo: string,
    newKey: string,
  ) {
    const response: RmqResponse<RmqResponseUser> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.update.2FA.rk',
        payload: {
          id: id,
          info: newInfo,
          key: newKey,
        },
      });
    if (!response.success) throw new HttpException(response.error, 500);
  }

  async deleteTwoFactorAuthenticationById(id: string) {
    const response: RmqResponse<RmqResponseUser> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.delete.2FA.rk',
        payload: {
          id: id,
        },
      });
    if (!response.success) throw new HttpException(response.error, 500);
  }
}
