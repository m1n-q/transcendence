import { AmqpResponse } from './user.amqp.response.interface';
import { CreateUserRequestDto } from './dto/create.user.request.dto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class UserService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async join(body: CreateUserRequestDto) {
    const user: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.create.rk',
      payload: {
        thirdPartyId: body.thirdPartyId,
        provider: body.provider,
        nickname: body.nickname,
        '2FA': body['2FA'],
        profImg: body.profImg,
      },
    });
    if (user.success === false) {
      throw new ConflictException(user.error.message);
    }
    return user;
  }

  async getById(id: string) {
    const user: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.read.by.id.rk',
      payload: {
        id: id,
      },
    });
    console.log(user);
    if (user.success === false) {
      throw new NotFoundException(user.error.message);
    }
    return user;
  }

  async deleteById(id: string) {
    const user: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.delete.rk',
      payload: {
        id: id,
      },
    });
    if (user.success === false) {
      throw new NotFoundException(user.error.message);
    }
  }

  async getNicknameById(id: string) {
    const user: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.read.nickname.rk',
      payload: {
        id: id,
      },
    });
    if (user.success === false) {
      throw new NotFoundException(user.error.message);
    }
    return user;
  }

  async updateNicknameById(id: string, newNickname: string) {
    const user: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.update.nickname.rk',
      payload: {
        id: id,
        nickname: newNickname,
      },
    });
    if (user.success === false) {
      throw new NotFoundException(user.error.message);
    }
  }

  async getProfImgById(id: string) {
    const user: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.read.profImg.rk',
      payload: {
        id: id,
      },
    });
    if (user.success === false) {
      throw new NotFoundException(user.error.message);
    }
    return user;
  }

  async updateProfImgById(id: string, newProfileImage: string) {
    const user: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.update.profImg.rk',
      payload: {
        id: id,
        profImg: newProfileImage,
      },
    });
    if (user.success === false) {
      throw new NotFoundException(user.error.message);
    }
  }

  async getTwoFactorAuthenticationById(id: string) {
    const user: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.read.2FA.rk',
      payload: {
        id: id,
      },
    });
    if (user.success === false) {
      throw new NotFoundException(user.error.message);
    }
    return user;
  }

  async updateTwoFactorAuthenticationById(
    id: string,
    newInfo: string,
    newKey: string,
  ) {
    const user: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.update.2FA.rk',
      payload: {
        id: id,
        info: newInfo,
        key: newKey,
      },
    });
    if (user.success === false) {
      throw new NotFoundException(user.error.message);
    }
  }

  async deleteTwoFactorAuthenticationById(id: string) {
    const user: AmqpResponse = await this.amqpConnection.request({
      exchange: 'user.d.x',
      routingKey: 'user.delete.2FA.rk',
      payload: {
        id: id,
      },
    });
    if (user.success === false) {
      throw new NotFoundException(user.error.message);
    }
    return user;
  }
}
