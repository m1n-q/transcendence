import {
  RmqUserId,
  RmqUSer3pID,
  RmqUserCreate,
  RmqUserUpdateNickname,
  RmqUserUpdateProfImg,
  RmqUserUpdate2FA,
} from './dto/rmq.user.request.dto';
import { UserService } from './user.service';
import { Controller, UseInterceptors } from '@nestjs/common';
import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { RmqInterceptor } from '../interceptors/rmq.response.interceptor';
import { RmqErrorHandler } from '../interceptors/rmq-error.handler';

@UseInterceptors(new RmqInterceptor())
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.by.id.rk',
    queue: 'user.read.by.id.q',
    errorHandler: RmqErrorHandler,
  })
  async readUserById(@RabbitPayload() msg: RmqUserId) {
    return this.userService.readUserById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.by.3pId.rk',
    queue: 'user.read.by.3pId.q',
    errorHandler: RmqErrorHandler,
  })
  async readUserBy3pId(@RabbitPayload() msg: RmqUSer3pID) {
    return this.userService.readUserBy3pId(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.create.rk',
    queue: 'user.create.q',
    errorHandler: RmqErrorHandler,
  })
  async createUser(@RabbitPayload() msg: RmqUserCreate) {
    return this.userService.createUser(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.delete.rk',
    queue: 'user.delete.q',
    errorHandler: RmqErrorHandler,
  })
  async deleteUser(@RabbitPayload() msg: RmqUserId) {
    return this.userService.deleteUserById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.nickname.rk',
    queue: 'user.read.nickname.q',
    errorHandler: RmqErrorHandler,
  })
  async readUserNickname(@RabbitPayload() msg: RmqUserId) {
    return this.userService.readUserNicknameById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.update.nickname.rk',
    queue: 'user.update.nickname.q',
    errorHandler: RmqErrorHandler,
  })
  async updateUserNickname(@RabbitPayload() msg: RmqUserUpdateNickname) {
    return this.userService.updateUserNicknameById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.profImg.rk',
    queue: 'user.read.profImg.q',
    errorHandler: RmqErrorHandler,
  })
  async readUserProfImg(@RabbitPayload() msg: RmqUserId) {
    return this.userService.readUserProfImgById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.update.profImg.rk',
    queue: 'user.update.profImg.q',
    errorHandler: RmqErrorHandler,
  })
  async updateUserProfImg(@RabbitPayload() msg: RmqUserUpdateProfImg) {
    return this.userService.updateUserProfImgById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.2FA.rk',
    queue: 'user.read.2FA.q',
    errorHandler: RmqErrorHandler,
  })
  async readUser2FA(@RabbitPayload() msg: RmqUserId) {
    return this.userService.readUser2FAById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.update.2FA.rk',
    queue: 'user.update.2FA.q',
    errorHandler: RmqErrorHandler,
  })
  async updateUser2FA(@RabbitPayload() msg: RmqUserUpdate2FA) {
    return this.userService.updateUser2FAById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.delete.2FA.rk',
    queue: 'user.delete.2FA.q',
    errorHandler: RmqErrorHandler,
  })
  async deleteUser2FA(@RabbitPayload() msg: RmqUserId) {
    return this.userService.deleteUser2FAById(msg);
  }
}
