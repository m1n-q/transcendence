import { FriendService } from './friend.service';
import { RmqResponseInterceptor } from 'src/common/rmq-module/types/rmq-response.interceptor.ts';
import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Controller, UseInterceptors } from '@nestjs/common';
import { RmqErrorHandler } from 'src/common/rmq-module/types/rmq-error.handler';
import {
  RmqRequestFriend,
  RmqRequestFriendId,
  RmqRequestBlockFriend,
} from './dto/rmq.friend.request';

@UseInterceptors(new RmqResponseInterceptor())
@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.create.friend.request.rk',
    queue: 'user.create.friend.request.q',
    errorHandler: RmqErrorHandler,
  })
  async createFriendRequest(@RabbitPayload() msg: RmqRequestFriend) {
    return this.friendService.createFriendRequest(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.friend.request.rk',
    queue: 'user.read.friend.request.q',
    errorHandler: RmqErrorHandler,
  })
  async readFriendRequest(@RabbitPayload() msg: RmqRequestFriendId) {
    return this.friendService.readFriendRequest(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.delete.friend.request.rk',
    queue: 'user.delete.friend.request.q',
    errorHandler: RmqErrorHandler,
  })
  async deleteFriendRequest(@RabbitPayload() msg: RmqRequestFriend) {
    return this.friendService.deleteFriendRequest(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.create.friend.block.rk',
    queue: 'user.create.friend.block.q',
    errorHandler: RmqErrorHandler,
  })
  async createBlockFriend(@RabbitPayload() msg: RmqRequestBlockFriend) {
    return this.friendService.createBlockFriend(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.friend.block.rk',
    queue: 'user.read.friend.block.q',
    errorHandler: RmqErrorHandler,
  })
  async readBlockFriend(@RabbitPayload() msg: RmqRequestFriendId) {
    return this.friendService.readBlockFriend(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.delete.friend.block.rk',
    queue: 'user.delete.friend.block.q',
    errorHandler: RmqErrorHandler,
  })
  async deleteBlockFriend(@RabbitPayload() msg: RmqRequestBlockFriend) {
    return this.friendService.deleteBlockFriend(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.create.friend.rk',
    queue: 'user.create.friend.q',
    errorHandler: RmqErrorHandler,
  })
  async createFriend(@RabbitPayload() msg: RmqRequestFriend) {
    return this.friendService.createFriend(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.friend.rk',
    queue: 'user.read.friend.q',
    errorHandler: RmqErrorHandler,
  })
  async readFriend(@RabbitPayload() msg: RmqRequestFriendId) {
    return this.friendService.readFriend(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.delete.friend.rk',
    queue: 'user.delete.friend.q',
    errorHandler: RmqErrorHandler,
  })
  async deleteFriend(@RabbitPayload() msg: RmqRequestFriend) {
    return this.friendService.deleteFriend(msg);
  }
}
