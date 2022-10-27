import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { AmqpResponse } from './../user/user.amqp.response.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FriendService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async createFriendRequest(body) {
    const friend: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.create.friend.request.rk',
      payload: {
        requester: body.requester,
        receiver: body.receiver,
      },
    });
    console.log(friend);
    return friend;
  }

  async deleteFriendRequest(body) {
    const friend: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.delete.friend.request.rk',
      payload: {
        requester: body.requester,
        receiver: body.receiver,
      },
    });
    console.log(friend);
    return friend;
  }

  async readFriendRequest(id) {
    const friend: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.read.friend.request.rk',
      payload: {
        userId: id,
      },
    });
    console.log(friend);
    return friend;
  }

  async createFriendBlock(body) {
    const friend: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.create.friend.block.rk',
      payload: {
        blocker: body.blocker,
        blocked: body.blocked,
      },
    });
    console.log(friend);
    return friend;
  }

  async deleteFriendBlock(body) {
    const friend: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.delete.friend.block.rk',
      payload: {
        blocker: body.blocker,
        blocked: body.blocked,
      },
    });
    console.log(friend);
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
    console.log(friend);
    return friend;
  }

  async createFriend(body) {
    const friend: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.create.friend.rk',
      payload: {
        requester: body.requester,
        receiver: body.receiver,
      },
    });
    console.log(friend);
    return friend;
  }

  async deleteFriend(body) {
    const friend: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.delete.friend.rk',
      payload: {
        requester: body.requester,
        receiver: body.receiver,
      },
    });
    console.log(friend);
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
    console.log(friend);
    return friend;
  }
}
