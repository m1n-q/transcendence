import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { AmqpResponse } from './../user/user.amqp.response.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FriendService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async createFriendRequest(id, friendId) {
    const friend: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.create.friend.request.rk',
      payload: {
        requester: id,
        receiver: friendId,
      },
    });

    return friend;
  }

  async deleteFriendRequest(id, friendId) {
    const friend: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.delete.friend.request.rk',
      payload: {
        requester: id,
        receiver: friendId,
      },
    });

    return friend;
  }

  async readFriendRequest(id: string) {
    const friend: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.read.friend.request.rk',
      payload: {
        userId: id,
      },
    });

    return friend;
  }

  async createFriendBlock(id, blockedId) {
    const friend: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.create.friend.block.rk',
      payload: {
        blocker: id,
        blocked: blockedId,
      },
    });

    return friend;
  }

  async deleteFriendBlock(id, blockedId) {
    const friend: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.delete.friend.block.rk',
      payload: {
        blocker: id,
        blocked: blockedId,
      },
    });

    return friend;
  }

  async readFriendBlock(id) {
    const friend: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.read.friend.block.rk',
      payload: {
        userId: id,
      },
    });

    return friend;
  }

  async createFriend(id, friendId) {
    const friend: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.create.friend.rk',
      payload: {
        requester: id,
        receiver: friendId,
      },
    });

    return friend;
  }

  async deleteFriend(id, friendId) {
    const friend: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.delete.friend.rk',
      payload: {
        requester: id,
        receiver: friendId,
      },
    });

    return friend;
  }

  async readFriend(id) {
    const friend: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.read.friend.rk',
      payload: {
        userId: id,
      },
    });

    return friend;
  }
}
