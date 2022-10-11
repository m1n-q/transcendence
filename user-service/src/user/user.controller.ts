import { UserService } from './user.service';
import { Controller, UseInterceptors } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { RmqInterceptor } from './user.rmq.response.interceptor';

@UseInterceptors(new RmqInterceptor())
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.by.id.rk',
    queue: 'user.read.by.id.q',
  })
  async readUserById(msg) {
    return this.userService.readUserById(msg.id);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.by.3pId.rk',
    queue: 'user.read.by.3pId.q',
  })
  async readUserBy3pId(msg) {
    return this.userService.readUserBy3pId(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.create.rk',
    queue: 'user.create.q',
  })
  async createUser(msg) {
    return this.userService.createUser(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.delete.rk',
    queue: 'user.delete.q',
  })
  async deleteUser(msg) {
    return this.userService.deleteUserById(msg.id);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.nickname.rk',
    queue: 'user.read.nickname.q',
  })
  async readUserNickname(msg) {
    return this.userService.readUserNicknameById(msg.payload);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.update.nickname.rk',
    queue: 'user.update.nickname.q',
  })
  async updateUserNickname(msg) {
    return this.userService.updateUserNicknameById(msg.id, msg.nickname);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.profImg.rk',
    queue: 'user.read.profImg.q',
  })
  async readUserProfImg(msg) {
    return this.userService.readUserProfImgById(msg.id);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.update.profImg.rk',
    queue: 'user.update.profImg.q',
  })
  async updateUserProfImg(msg) {
    return this.userService.updateUserProfImgById(msg.id, msg.profImg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.read.2FA.rk',
    queue: 'user.read.2FA.q',
  })
  async readUser2FA(msg) {
    return this.userService.readUser2FAById(msg.id);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.update.2FA.rk',
    queue: 'user.update.2FA.q',
  })
  async updateUser2FA(msg) {
    return this.userService.updateUser2FAById(msg.id, msg.info, msg.key);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'user.delete.2FA.rk',
    queue: 'user.delete.2FA.q',
  })
  async deleteUser2FA(msg) {
    return this.userService.deleteUser2FAById(msg.id);
  }
}
