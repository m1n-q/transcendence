import {
  RmqUserIdDto,
  RmqUSer3pIDDto,
  RmqUserCreateDto,
  RmqUserUpdateNicknameDto,
  RmqUserNicknameDto,
  RmqUserStateDto,
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
    routingKey: 'req.to.user.create.rk',
    queue: 'user.create.q',
    errorHandler: RmqErrorHandler,
  })
  async createUser(@RabbitPayload() msg: RmqUserCreateDto) {
    return await this.userService.createUser(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'req.to.user.read.by.nickname.rk',
    queue: 'user.read.by.nickname.q',
    errorHandler: RmqErrorHandler,
  })
  async readUserByNickname(@RabbitPayload() msg: RmqUserNicknameDto) {
    const user = await this.userService.readUserByNickname(msg);
    user.created = user.created.toString();
    return user;
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'req.to.user.read.by.id.rk',
    queue: 'user.read.by.id.q',
    errorHandler: RmqErrorHandler,
  })
  async readUserById(@RabbitPayload() msg: RmqUserIdDto) {
    const user = await this.userService.readUserById(msg);
    user.created = user.created.toString();
    return user;
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'req.to.user.delete.rk',
    queue: 'user.delete.q',
    errorHandler: RmqErrorHandler,
  })
  async deleteUser(@RabbitPayload() msg: RmqUserIdDto) {
    return await this.userService.deleteUserById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'req.to.user.update.nickname.rk',
    queue: 'user.update.nickname.q',
    errorHandler: RmqErrorHandler,
  })
  async updateUserNicknameById(@RabbitPayload() msg: RmqUserUpdateNicknameDto) {
    return await this.userService.updateUserNicknameById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'req.to.user.update.profImg.rk',
    queue: 'user.update.profImg.q',
    errorHandler: RmqErrorHandler,
  })
  async updateUserProfImgById(@RabbitPayload() msg) {
    return await this.userService.updateUserProfImgById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'req.to.user.update.2FA.rk',
    queue: 'user.update.2FA.q',
    errorHandler: RmqErrorHandler,
  })
  async updateUser2FAById(@RabbitPayload() msg) {
    return await this.userService.updateUser2FAById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'req.to.user.update.2FA.enable.rk',
    queue: 'user.update.2FA.enable.q',
    errorHandler: RmqErrorHandler,
  })
  async updateUser2FAEnableById(@RabbitPayload() msg) {
    return await this.userService.updateUser2FAEnableById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'req.to.user.delete.2FA.rk',
    queue: 'user.delete.2FA.q',
    errorHandler: RmqErrorHandler,
  })
  async deleteUser2FAEnableById(@RabbitPayload() msg) {
    return await this.userService.deleteUser2FAById(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'req.to.user.read.by.3pId.rk',
    queue: 'user.read.by.3pId.q',
    errorHandler: RmqErrorHandler,
  })
  async readUserBy3pId(@RabbitPayload() msg: RmqUSer3pIDDto) {
    const user = await this.userService.readUserBy3pId(msg);
    user.created = user.created.toString();
    return user;
  }
  // 임시
  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'req.to.user.read.list.rk',
    queue: 'user.read.list.q',
    errorHandler: RmqErrorHandler,
  })
  async readUserList() {
    return await this.userService.readUserList();
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'req.to.user.get.state.rk',
    queue: 'user.get.state.q',
    errorHandler: RmqErrorHandler,
  })
  async getUserState(@RabbitPayload() payload: RmqUserIdDto) {
    return await this.userService.getUserState(payload);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'req.to.user.set.state.rk',
    queue: 'user.set.state.q',
    errorHandler: RmqErrorHandler,
  })
  setUserState(@RabbitPayload() payload: RmqUserStateDto): any {
    return this.userService.setUserState(payload);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'req.to.user.delete.withdrawal.user.rk',
    queue: 'user.delete.withdrawal.user.q',
    errorHandler: RmqErrorHandler,
  })
  deleteOldWithdrawalUser() {
    return this.userService.deleteOldWithdrawalUser();
  }
}
