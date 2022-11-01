import { RmqResponse } from './../common/rmq/types/rmq-response';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { HttpException, Injectable } from '@nestjs/common';
import {
  RmqResponseBlockFriend,
  RmqResponseFriend,
} from './dto/friend.reponse.dto';

@Injectable()
export class FriendService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async createFriendRequest(id, friendId) {
    const response: RmqResponse<RmqResponseFriend> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.create.friend.request.rk',
        payload: {
          requester: id,
          receiver: friendId,
        },
      });
    if (!response.success) throw new HttpException(response.error, 500);
    return response;
  }

  async deleteFriendRequest(id, friendId) {
    const response: RmqResponse<RmqResponseFriend> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.delete.friend.request.rk',
        payload: {
          requester: id,
          receiver: friendId,
        },
      });
    if (!response.success) throw new HttpException(response.error, 500);
  }

  async readFriendRequest(id: string) {
    const response: RmqResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.read.friend.request.rk',
      payload: {
        userId: id,
      },
    });
    if (!response.success) throw new HttpException(response.error, 500);
    return response;
  }

  async createFriendBlock(id, blockedId) {
    const response: RmqResponse<RmqResponseBlockFriend> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.create.friend.block.rk',
        payload: {
          blocker: id,
          blocked: blockedId,
        },
      });
    if (!response.success) throw new HttpException(response.error, 500);
    return response;
  }

  async deleteFriendBlock(id, blockedId) {
    const response: RmqResponse<RmqResponseBlockFriend> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.delete.friend.block.rk',
        payload: {
          blocker: id,
          blocked: blockedId,
        },
      });
    if (!response.success) throw new HttpException(response.error, 500);
  }

  async readFriendBlock(id) {
    const response: RmqResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.read.friend.block.rk',
      payload: {
        userId: id,
      },
    });
    if (!response.success) throw new HttpException(response.error, 500);
    return response;
  }

  async createFriend(id, friendId) {
    const response: RmqResponse<RmqResponseFriend> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.create.friend.rk',
        payload: {
          requester: friendId,
          receiver: id,
        },
      });
    if (!response.success) throw new HttpException(response.error, 500);
    return response;
  }

  async deleteFriend(id, friendId) {
    const response: RmqResponse<RmqResponseFriend> =
      await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.delete.friend.rk',
        payload: {
          requester: id,
          receiver: friendId,
        },
      });
    if (!response.success) throw new HttpException(response.error, 500);
    return response;
  }

  async readFriend(id) {
    const response: RmqResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.read.friend.rk',
      payload: {
        userId: id,
      },
    });
    if (!response.success) throw new HttpException(response.error, 500);
    return response;
  }
}
