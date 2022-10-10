import { CreateUserRequestDto } from './dto/create.user.request.dto';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/entities/User';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  errorReturn(code: number, message: string) {
    return {
      success: 'false',
      data: null,
      error: {
        code: code,
        message: message,
        where: 'user-service',
      },
    };
  }

  successReturn(data) {
    return {
      success: 'true',
      data: data,
      error: null,
    };
  }

  async readUserBy3pId(payload) {
    const provider = payload.provider;
    const thirdPartyId = payload.thirdPartyId;
    const findId = await this.userRepository.findOne({
      where: { thirdPartyId: thirdPartyId, provider: provider },
    });
    if (findId) return this.successReturn(findId);
    return this.errorReturn(404, `${thirdPartyId} not found`);
  }

  async readUserById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user || user.deletedDate != null) {
      return this.errorReturn(404, `${id} not found`);
    }
    return this.successReturn(user);
  }

  async createUser(payload: CreateUserRequestDto) {
    const findId = await this.readUserBy3pId(payload);

    if (findId.success === 'true') {
      return this.errorReturn(409, 'This ID is already registered.');
    }

    const user = new User();
    user.nickname = payload.nickname;
    user.thirdPartyId = payload.thirdPartyId;
    user.provider = payload.provider;
    user.profileImage = payload.profImg;
    user.rankScore = 1000;

    if (payload.towFactorAuthentication !== undefined) {
      user.twoFactorAuthenticationInfo = payload.towFactorAuthentication.info;
      user.twoFactorAuthenticationKey = payload.towFactorAuthentication.key;
    }
    try {
      await this.userRepository.save(user);
    } catch (error) {
      return this.errorReturn(409, 'Conflict');
    }

    return this.successReturn({
      userId: user.id,
      nickname: user.nickname,
      createdDate: user.createdDate,
    });
  }

  async getById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user || user.deletedDate != null) {
      return this.errorReturn(404, `${id} not found`);
    }
    return this.successReturn({
      userId: user.id,
      nickname: user.nickname,
      profImg: user.profileImage,
      mmr: user.rankScore,
    });
  }

  async deleteUserById(id: string) {
    // 계속 삭제 되는 문제가 있음
    // 해당 아이디 찾아와서 deleteData 있는지 확인 후 넘겨야 하는지??
    // 일단 먼저 찾아서 확인 후 진행
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user || user.deletedDate != null) {
      return this.errorReturn(404, `${id} not found`);
    }
    const deleteResponse = await this.userRepository.softDelete(id);
    if (!deleteResponse.affected) {
      return this.errorReturn(404, `${id} not found`);
    }
    return this.successReturn(null);
  }

  async readUserNicknameById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user || user.deletedDate != null) {
      return this.errorReturn(404, `${id} not found`);
    }
    return this.successReturn({
      nickname: user.nickname,
    });
  }

  async updateUserNicknameById(id: string, newNickname: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user || user.deletedDate != null) {
      return this.errorReturn(404, `${id} not found`);
    }
    user.nickname = newNickname;
    try {
      await this.userRepository.save(user);
    } catch (error) {
      return this.errorReturn(409, 'Conflict');
    }
    return this.successReturn({
      nickname: user.nickname,
    });
  }

  async readUserProfImgById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user || user.deletedDate != null) {
      return this.errorReturn(404, `${id} not found`);
    }
    return this.successReturn({
      profImg: user.profileImage,
    });
  }

  async updateUserProfImgById(id: string, newProfileImage: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user || user.deletedDate != null) {
      return this.errorReturn(404, `${id} not found`);
    }
    user.profileImage = newProfileImage;
    try {
      await this.userRepository.save(user);
    } catch (error) {
      return this.errorReturn(409, 'Conflict');
    }
    return this.successReturn({
      profImg: user.profileImage,
    });
  }

  async readUser2FAById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user || user.deletedDate != null) {
      return this.errorReturn(404, `${id} not found`);
    }
    return this.successReturn({
      info: user.twoFactorAuthenticationInfo,
      key: user.twoFactorAuthenticationKey,
    });
  }

  async updateUser2FAById(id: string, newInfo: string, newKey: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user || user.deletedDate != null) {
      return this.errorReturn(404, `${id} not found`);
    }
    user.twoFactorAuthenticationInfo = newInfo;
    user.twoFactorAuthenticationKey = newKey;

    try {
      await this.userRepository.save(user);
    } catch (error) {
      return this.errorReturn(409, 'Conflict');
    }

    return this.successReturn({
      info: user.twoFactorAuthenticationInfo,
      key: user.twoFactorAuthenticationKey,
    });
  }

  async deleteUser2FAById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user || user.deletedDate != null) {
      return this.errorReturn(404, `${id} not found`);
    }
    user.twoFactorAuthenticationInfo = null;
    user.twoFactorAuthenticationKey = null;
    try {
      await this.userRepository.save(user);
    } catch (error) {
      return this.errorReturn(409, 'Conflict');
    }
    return this.successReturn(null);
  }
}
