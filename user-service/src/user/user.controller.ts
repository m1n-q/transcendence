import {
  RmqUserIdDto,
  RmqUSer3pIDDto,
  RmqUserCreateDto,
  RmqUserUpdateNicknameDto,
  RmqUserNicknameDto,
} from './dto/rmq.user.request.dto';
import { UserService } from './user.service';
import { Controller, UseInterceptors } from '@nestjs/common';
import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { RmqResponseInterceptor } from 'src/common/rmq-module/interceptors/rmq-response.interceptor.ts';
import { RmqErrorHandler } from 'src/common/rmq-module/types/rmq-error.handler';

@UseInterceptors(new RmqResponseInterceptor())
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.create.rk',
    queue: 'user.create.q',
    errorHandler: RmqErrorHandler,
  })
  async createUser(@RabbitPayload() msg: RmqUserCreateDto) {
    return this.userService.createUser(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.by.nickname.rk',
    queue: 'user.read.by.nickname.q',
    errorHandler: RmqErrorHandler,
  })
  async readUserByNickname(@RabbitPayload() msg: RmqUserNicknameDto) {
    return this.userService.readUserByNickname(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.by.id.rk',
    queue: 'user.read.by.id.q',
    errorHandler: RmqErrorHandler,
  })
  async readUserById(@RabbitPayload() msg: RmqUserIdDto) {
    return this.userService.readUserById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.delete.rk',
    queue: 'user.delete.q',
    errorHandler: RmqErrorHandler,
  })
  async deleteUser(@RabbitPayload() msg: RmqUserIdDto) {
    return this.userService.deleteUserById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.update.nickname.rk',
    queue: 'user.update.nickname.q',
    errorHandler: RmqErrorHandler,
  })
  async updateUserNicknameById(@RabbitPayload() msg: RmqUserUpdateNicknameDto) {
    return this.userService.updateUserNicknameById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.update.profImg.rk',
    queue: 'user.update.profImg.q',
    errorHandler: RmqErrorHandler,
  })
  async updateUserProfImgById(@RabbitPayload() msg) {
    return this.userService.updateUserProfImgById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.update.2FA.rk',
    queue: 'user.update.2FA.q',
    errorHandler: RmqErrorHandler,
  })
  async updateUser2FAById(@RabbitPayload() msg) {
    return this.userService.updateUser2FAById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.by.3pId.rk',
    queue: 'user.read.by.3pId.q',
    errorHandler: RmqErrorHandler,
  })
  async readUserBy3pId(@RabbitPayload() msg: RmqUSer3pIDDto) {
    return this.userService.readUserBy3pId(msg);
  }
  // 임시
  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.list.rk',
    queue: 'user.read.list.q',
    errorHandler: RmqErrorHandler,
  })
  async readUserList() {
    return this.userService.readUserList();
  }
}
