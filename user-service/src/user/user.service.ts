import { RmqError } from 'src/common/rmq-module/types/rmq-error';
import {
  RmqUSer3pIDDto,
  RmqUserCreateDto,
  RmqUserIdDto,
  RmqUserUpdateNicknameDto,
  RmqUserNicknameDto,
} from './dto/rmq.user.request.dto';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/User';
import { InjectRepository } from '@nestjs/typeorm';
import { UserInfo, UserProfile } from './user-info';

const WHERE = 'user_service';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(payload: RmqUserCreateDto): Promise<UserInfo> {
    const user = this.userRepository.create(payload);
    user.rankScore = 1000;
    if (payload['2FA'] !== undefined) {
      user.twoFactorAuthenticationType = payload['2FA'].type;
      user.twoFactorAuthenticationKey = payload['2FA'].key;
    }
    try {
      await this.userRepository.save(user);
    } catch (e) {
      if (e.code === '23505') {
        throw new RmqError({
          code: 409,
          message: 'duplicate key violates unique constraint',
          where: `${WHERE}#createUser()`,
        });
      } else {
        throw new RmqError({
          code: 500,
          message: `DB Error : ${e}`,
          where: WHERE,
        });
      }
    }
    return user;
  }

  async readUserByNickname(payload: RmqUserNicknameDto): Promise<UserProfile> {
    let user;
    try {
      user = await this.userRepository.findOne({
        where: { nickname: payload.nickname },
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    if (!user) {
      throw new RmqError({
        code: 404,
        message: `${payload.nickname} not found`,
        where: `${WHERE}#readUserByNickname()`,
      });
    }
    delete user.provider;
    delete user.thirdPartyId;
    delete user.twoFactorAuthenticationKey;
    delete user.twoFactorAuthenticationInfo;
    return user;
  }

  async readUserById(payload: RmqUserIdDto): Promise<UserInfo> {
    let user;
    try {
      user = await this.userRepository.findOne({ where: { id: payload.id } });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    if (!user) {
      throw new RmqError({
        code: 404,
        message: `${payload.id} not found`,
        where: `${WHERE}#readUserById()`,
      });
    }
    return user;
  }

  async deleteUserById(payload: RmqUserIdDto) {
    await this.readUserById(payload);

    let response;
    try {
      response = await this.userRepository.softDelete(payload.id);
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    if (!response.affected) {
      throw new RmqError({
        code: 404,
        message: `${payload.id} soft delete error`,
        where: `${WHERE}#deleteUserById()`,
      });
    }
    return;
  }

  async updateUserNicknameById(payload: RmqUserUpdateNicknameDto) {
    const user = await this.readUserById(payload);
    user.nickname = payload.nickname;

    try {
      await this.userRepository.save(user);
    } catch (e) {
      if (e.code === '23505') {
        throw new RmqError({
          code: 409,
          message: 'duplicate key violates unique constraint',
          where: `${WHERE}#updateUserNicknameById()`,
        });
      } else {
        throw new RmqError({
          code: 500,
          message: `DB Error : ${e}`,
          where: WHERE,
        });
      }
    }
    return;
  }

  async updateUserProfImgById(payload) {
    const user = await this.readUserById(payload);
    user.profImg = payload.profImg;

    try {
      await this.userRepository.save(user);
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    return;
  }

  async updateUser2FAById(payload) {
    const user = await this.readUserById(payload);

    console.log(payload);
    user.twoFactorAuthenticationType = payload.type;
    user.twoFactorAuthenticationKey = payload.key;

    try {
      await this.userRepository.save(user);
    } catch (e) {
      if (e.code === '23505') {
        throw new RmqError({
          code: 409,
          message: 'duplicate key violates unique constraint',
          where: `${WHERE}#updateUser2FAById()`,
        });
      } else {
        throw new RmqError({
          code: 500,
          message: `DB Error : ${e}`,
          where: WHERE,
        });
      }
    }
    return {
      type: user.twoFactorAuthenticationType,
      key: user.twoFactorAuthenticationKey,
    };
  }

  async readUserBy3pId(payload: RmqUSer3pIDDto): Promise<UserInfo> {
    let user;
    try {
      user = await this.userRepository.findOne({
        where: {
          thirdPartyId: payload.thirdPartyId,
          provider: payload.provider,
        },
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    if (!user) {
      throw new RmqError({
        code: 404,
        message: `${payload.thirdPartyId} not found`,
        where: `${WHERE}#readUserBy3pId()`,
      });
    }
    return user;
  }

  async readUserList() {
    let list;
    try {
      list = await this.userRepository.find();
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    return list;
  }
}
