import { FriendService } from './friend.service';
import { RmqInterceptor } from './../interceptors/rmq.response.interceptor';
import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Controller, UseInterceptors } from '@nestjs/common';
import { RmqErrorHandler } from 'src/interceptors/rmq-error.handler';
import { RmqFriendRequest, RmqFriendRequestId } from './dto/rmq.friend.request';

@UseInterceptors(new RmqInterceptor())
@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.create.friend.request.rk',
    queue: 'user.create.friend.request.q',
    errorHandler: RmqErrorHandler,
  })
  async createFriendRequest(@RabbitPayload() msg: RmqFriendRequest) {
    return this.friendService.createFriendRequest(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.friend.request.rk',
    queue: 'user.read.friend.request.q',
    errorHandler: RmqErrorHandler,
  })
  async readFriendRequest(@RabbitPayload() msg: RmqFriendRequestId) {
    return this.friendService.readFriendRequest(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.delete.friend.request.rk',
    queue: 'user.delete.friend.request.q',
    errorHandler: RmqErrorHandler,
  })
  async deleteFriendRequest(@RabbitPayload() msg: RmqFriendRequest) {
    return this.friendService.deleteFriendRequest(msg);
  }
}
