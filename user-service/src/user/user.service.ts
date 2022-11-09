import { RmqError } from 'src/common/rmq-module/types/rmq-error';
import {
  RmqUSer3pIDDto,
  RmqUserCreateDto,
  RmqUserIdDto,
  RmqUserUpdateNicknameDto,
  RmqUserNicknameDto,
} from './dto/rmq.user.request.dto';
import { Injectable, PipeTransform } from '@nestjs/common';
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

  async createUser(payload: RmqUserCreateDto) {
    const user: UserInfo = this.userRepository.create(payload);
    user.mmr = 1000;
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

    return {
      user_id: user.user_id,
      nickname: user.nickname,
      created: user.created.toString(),
    };
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
    delete user.third_party_id;
    delete user.two_factor_authentication_key;
    delete user.two_factor_authentication_type;
    return user;
  }

  async readUserById(payload: RmqUserIdDto) {
    let user;
    try {
      user = await this.userRepository.findOne({
        where: { user_id: payload.user_id },
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
        message: `${payload.user_id} not found`,
        where: `${WHERE}#readUserById()`,
      });
    }
    return user;
  }

  async deleteUserById(payload: RmqUserIdDto) {
    await this.readUserById(payload);

    let response;
    try {
      response = await this.userRepository.softDelete(payload.user_id);
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
        message: `${payload.user_id} soft delete error`,
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
    return { nickname: user.nickname };
  }

  async updateUserProfImgById(payload) {
    const user = await this.readUserById(payload);
    user.prof_img = payload.prof_img;
    try {
      await this.userRepository.save(user);
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    return { prof_img: user.prof_img };
  }

  async updateUser2FAById(payload) {
    const user = await this.readUserById(payload);
    user.two_factor_authentication_type = payload.type;
    user.two_factor_authentication_key = payload.key;

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
      type: user.two_factor_authentication_type,
      key: user.two_factor_authentication_key,
    };
  }

  async readUserBy3pId(payload: RmqUSer3pIDDto): Promise<UserInfo> {
    let user;
    try {
      user = await this.userRepository.findOne({
        where: {
          third_party_id: payload.third_party_id,
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
        message: `${payload.third_party_id} not found`,
        where: `${WHERE}#readUserBy3pId()`,
      });
    }
    return user;
  }

  async readUserListById(userIdList) {
    const list = await Promise.all(
      Object.values(userIdList).map(async (item: string) => {
        try {
          const user = await this.userRepository.findOne({
            where: { user_id: item },
          });
          return {
            user_id: user.user_id,
            nickname: user.nickname,
            prof_img: user.prof_img,
            mmr: user.mmr,
            created: user.created.toString(),
            deleted: user.deleted,
          };
        } catch (e) {
          throw new RmqError({
            code: 500,
            message: `DB Error : ${e}`,
            where: WHERE,
          });
        }
      }),
    );
    return list;
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
