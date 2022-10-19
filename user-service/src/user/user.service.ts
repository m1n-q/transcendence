import { RmqError } from './dto/rmq.user.response.dto';
import {
  RmqUSer3pID,
  RmqUserCreate,
  RmqUserId,
  RmqUserUpdateNickname,
  RmqUserUpdate2FA,
  RmqUserUpdateProfImg,
} from './dto/rmq.user.request.dto';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/entities/User';
import { InjectRepository } from '@nestjs/typeorm';

const WHERE = 'user_service';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async readUserBy3pId(payload: RmqUSer3pID) {
    const user = await this.userRepository.findOne({
      where: { thirdPartyId: payload.thirdPartyId, provider: payload.provider },
    });
    if (!user) {
      throw new RmqError(404, `${payload.thirdPartyId} not found`, WHERE);
    }
    return user;
  }

  async readUserById(payload: RmqUserId) {
    const id = payload.id;
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user || user.deletedDate != null) {
      throw new RmqError(404, `${id} not found`, WHERE);
    }
    return user;
  }

  async createUser(payload: RmqUserCreate) {
    const findUser = await this.userRepository.findOne({
      where: { thirdPartyId: payload.thirdPartyId, provider: payload.provider },
    });
    if (findUser) {
      throw new RmqError(409, 'cannot create or update User', WHERE);
    }

    const user = this.userRepository.create(payload);

    user.rankScore = 1000;

    if (payload['2FA'] !== undefined) {
      user.twoFactorAuthenticationInfo = payload['2FA'].info;
      user.twoFactorAuthenticationKey = payload['2FA'].key;
    }

    try {
      await this.userRepository.save(user);
    } catch (error) {
      throw new RmqError(409, 'Conflict', WHERE);
    }
    // 일단 모두 리턴
    return user;
  }

  async deleteUserById(payload: RmqUserId) {
    // 정책에 따라 변경 예정
    await this.readUserById(payload);

    const deleteResponse = await this.userRepository.softDelete(payload.id);
    if (!deleteResponse.affected) {
      throw new RmqError(404, `${payload.id} not found`, WHERE);
    }
    return null;
  }

  async readUserNicknameById(payload: RmqUserId) {
    const user = await this.readUserById(payload);
    return user.nickname;
  }

  async updateUserNicknameById(payload: RmqUserUpdateNickname) {
    const user = await this.readUserById(payload);
    user.nickname = payload.nickname;

    try {
      await this.userRepository.save(user);
    } catch (error) {
      throw new RmqError(409, 'Conflict', WHERE);
    }
    return user.nickname;
  }

  async readUserProfImgById(payload: RmqUserId) {
    const user = await this.readUserById(payload);
    return user.profImg;
  }

  async updateUserProfImgById(payload: RmqUserUpdateProfImg) {
    const user = await this.readUserById(payload);
    user.profImg = payload.id;

    try {
      await this.userRepository.save(user);
    } catch (error) {
      throw new RmqError(409, 'Conflict', WHERE);
    }
    return user.profImg;
  }

  async readUser2FAById(payload: RmqUserId) {
    const user = await this.readUserById(payload);

    return {
      info: user.twoFactorAuthenticationInfo,
      key: user.twoFactorAuthenticationKey,
    };
  }

  async updateUser2FAById(payload: RmqUserUpdate2FA) {
    const user = await this.readUserById(payload);

    user.twoFactorAuthenticationInfo = payload.info;
    user.twoFactorAuthenticationKey = payload.key;

    try {
      await this.userRepository.save(user);
    } catch (error) {
      throw new RmqError(409, 'Conflict', WHERE);
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
    } catch (error) {
      throw new RmqError(409, 'Conflict', WHERE);
    }
    return null;
  }
}
