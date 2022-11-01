import { RmqError } from 'src/common/rmq-module/types/rmq-error';
import {
  RmqUSer3pID,
  RmqUserCreate,
  RmqUserId,
  RmqUserUpdateNickname,
  RmqUserUpdate2FA,
  RmqUserUpdateProfImg,
  RmqUserNickname,
} from './dto/rmq.user.request.dto';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/User';
import { InjectRepository } from '@nestjs/typeorm';
import { listenerCount } from 'process';

const WHERE = 'user_service';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async readUserBy3pId(payload: RmqUSer3pID) {
    let user;
    try {
      user = await this.userRepository.findOne({
        where: {
          thirdPartyId: payload.thirdPartyId,
          provider: payload.provider,
        },
      });
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
    if (!user) {
      throw new RmqError(404, `${payload.thirdPartyId} not found`, WHERE);
    }
    return user;
  }

  async readUserById(payload: RmqUserId) {
    const id = payload.id;
    let user;
    try {
      user = await this.userRepository.findOne({ where: { id } });
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
    if (!user) {
      throw new RmqError(404, `${id} not found`, WHERE);
    }
    return user;
  }

  async readUserByNickname(payload: RmqUserNickname) {
    const nickname = payload.nickname;
    let user;
    try {
      user = await this.userRepository.findOne({ where: { nickname } });
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
    if (!user) {
      throw new RmqError(404, `${nickname} not found`, WHERE);
    }

    delete user.provider;
    delete user.thirdPartyId;
    delete user.twoFactorAuthenticationKey;
    delete user.twoFactorAuthenticationInfo;

    return user;
  }

  async createUser(payload: RmqUserCreate) {
    let findUser;
    try {
      findUser = await this.userRepository.findOne({
        where: {
          thirdPartyId: payload.thirdPartyId,
          provider: payload.provider,
        },
      });
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
    if (findUser) {
      throw new RmqError(409, 'user is already joined', WHERE);
    }

    const user = this.userRepository.create(payload);

    user.rankScore = 1000;

    if (payload['2FA'] !== undefined) {
      user.twoFactorAuthenticationInfo = payload['2FA'].info;
      user.twoFactorAuthenticationKey = payload['2FA'].key;
    }

    try {
      await this.userRepository.save(user);
    } catch (e) {
      if (e.code === '23505') {
        throw new RmqError(409, 'duplicate nickname or 2FA key', WHERE);
      } else {
        throw new RmqError(500, `DB Error : ${e}`, WHERE);
      }
    }
    return user;
  }

  async deleteUserById(payload: RmqUserId) {
    await this.readUserById(payload);

    let deleteResponse;
    try {
      deleteResponse = await this.userRepository.softDelete(payload.id);
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
    if (!deleteResponse.affected) {
      throw new RmqError(404, `${payload.id} not found`, WHERE);
    }
  }

  async updateUserNicknameById(payload: RmqUserUpdateNickname) {
    const user = await this.readUserById(payload);
    user.nickname = payload.nickname;

    try {
      await this.userRepository.save(user);
    } catch (e) {
      if (e.code === '23505') {
        throw new RmqError(409, 'duplicate nickname', WHERE);
      } else {
        throw new RmqError(500, `DB Error : ${e}`, WHERE);
      }
    }
    return user.nickname;
  }

  async updateUserProfImgById(payload: RmqUserUpdateProfImg) {
    const user = await this.readUserById(payload);
    user.profImg = payload.profImg;

    try {
      await this.userRepository.save(user);
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
    return user.profImg;
  }

  async updateUser2FAById(payload: RmqUserUpdate2FA) {
    const user = await this.readUserById(payload);

    user.twoFactorAuthenticationInfo = payload.info;
    user.twoFactorAuthenticationKey = payload.key;

    try {
      await this.userRepository.save(user);
    } catch (e) {
      if (e.code === '23505') {
        throw new RmqError(409, 'duplicate 2FA key', WHERE);
      } else {
        throw new RmqError(500, `DB Error : ${e}`, WHERE);
      }
    }
    return {
      info: user.twoFactorAuthenticationInfo,
      key: user.twoFactorAuthenticationKey,
    };
  }

  async deleteUser2FAById(payload: RmqUserId) {
    const user = await this.readUserById(payload);

    user.twoFactorAuthenticationInfo = null;
    user.twoFactorAuthenticationKey = null;
    try {
      await this.userRepository.save(user);
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
  }

  async readUserList() {
    let list;
    try {
      list = await this.userRepository.find();
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
    return list;
  }
}
