import { FriendService } from './friend.service';
import { RmqResponseInterceptor } from 'src/common/rmq-module/interceptors/rmq-response.interceptor.ts';
import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Controller, UseInterceptors } from '@nestjs/common';
import { RmqErrorHandler } from 'src/common/rmq-module/types/rmq-error.handler';
import {
  RmqRequestFriend,
  RmqDeleteFriend,
  RmqCancelFriendRequest,
  RmqAcceptFriendRequest,
  RmqRejectFriendRequest,
  RmqUserId,
} from './dto/rmq.friend.request';

@UseInterceptors(new RmqResponseInterceptor())
@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'rmq.to.user.read.friend.rk',
    queue: 'rmq.to.user.read.friend.q',
    errorHandler: RmqErrorHandler,
  })
  async readFriend(@RabbitPayload() msg: RmqUserId) {
    return this.friendService.readFriend(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'rmq.to.user.delete.friend.rk',
    queue: 'rmq.to.user.delete.friend.q',
    errorHandler: RmqErrorHandler,
  })
  async deleteFriend(@RabbitPayload() msg: RmqDeleteFriend) {
    return this.friendService.deleteFriend(msg);
  }

  //request=====================================================
  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'rmq.to.user.read.friend.request.sent.list.rk',
    queue: 'rmq.to.user.read.friend.request.sent.list.rk',
    errorHandler: RmqErrorHandler,
  })
  async readSentFriendRequest(@RabbitPayload() msg: RmqUserId) {
    return this.friendService.readSentFriendRequest(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'rmq.to.user.read.friend.request.recv.list.rk',
    queue: 'rmq.to.user.read.friend.request.recv.list.rk',
    errorHandler: RmqErrorHandler,
  })
  async readRecvFriendRequest(@RabbitPayload() msg: RmqUserId) {
    return this.friendService.readRecvFriendRequest(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'rmq.to.user.create.friend.request.rk',
    queue: 'rmq.to.user.create.friend.request.q',
    errorHandler: RmqErrorHandler,
  })
  async createFriendRequest(@RabbitPayload() msg: RmqRequestFriend) {
    return this.friendService.createFriendRequest(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'rmq.to.user.cancel.friend.request.rk',
    queue: 'rmq.to.user.cancel.friend.request.q',
    errorHandler: RmqErrorHandler,
  })
  async cancelFriendRequest(@RabbitPayload() msg: RmqCancelFriendRequest) {
    return this.friendService.cancelFriendRequest(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'rmq.to.user.accept.friend.request.rk',
    queue: 'rmq.to.user.accept.friend.request.q',
    errorHandler: RmqErrorHandler,
  })
  async acceptFriendRequest(@RabbitPayload() msg: RmqAcceptFriendRequest) {
    console.log('here');
    return this.friendService.acceptFriendRequest(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'rmq.to.user.reject.friend.request.rk',
    queue: 'rmq.to.user.reject.friend.request.q',
    errorHandler: RmqErrorHandler,
  })
  async rejectFriendRequest(@RabbitPayload() msg: RmqRejectFriendRequest) {
    return this.friendService.rejectFriendRequest(msg);
  }
}
