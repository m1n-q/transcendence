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
    // const findId: AmqpResponse = await this.amqpConnection.request({
    //   exchange: 'user.d.x',
    //   routingKey: 'user.read.by.3pId.rk',
    //   payload: {
    //     provider: body.provider,
    //     thirdPartyId: body.thirdPartyId,
    //   },
    // });
    // if (findId.success === true) {
    //   throw new ConflictException('cannot create or update User');
    // }
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
