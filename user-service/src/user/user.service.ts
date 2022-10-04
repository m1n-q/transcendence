import { CreateUserRequestDto } from './dto/create.user.request.dto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/entities/User';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findUserById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user || user.deletedDate != null) {
      throw new NotFoundException(`cannot find ${id}`);
    }
    return user;
  }

  async createOrUpdateUser(user: User) {
    try {
      await this.userRepository.save(user);
    } catch (error) {
      throw new ConflictException('cannot create or update User');
    }
  }

  async join(body: CreateUserRequestDto) {
    const thirdPartyId = body.thirdPartyId;
    const findId = await this.userRepository.findOne({
      where: { thirdPartyId },
    });

    if (findId) {
      throw new UnauthorizedException('This ID is already registered.');
    }

    const user = new User();
    user.nickname = body.nickname;
    user.thirdPartyId = body.thirdPartyId;
    user.profileImage = body.profImg;
    user.rankScore = 1000;

    if (body.towFactorAuthentication !== undefined) {
      user.twoFactorAuthenticationInfo = body.towFactorAuthentication.info;
      user.twoFactorAuthenticationKey = body.towFactorAuthentication.key;
    }

    await this.createOrUpdateUser(user);

    return {
      userId: user.id,
      nickname: user.nickname,
      createdDate: user.createdDate,
    };
  }

  async getById(id: string) {
    const user = await this.findUserById(id);

    return {
      userId: user.id,
      nickname: user.nickname,
      profImg: user.profileImage,
      mmr: user.rankScore,
    };
  }

  async deleteById(id: string) {
    // 계속 삭제 되는 문제가 있음
    // 해당 아이디 찾아와서 deleteData 있는지 확인 후 넘겨야 하는지??
    // 일단 먼저 찾아서 확인 후 진행
    await this.findUserById(id);
    const deleteResponse = await this.userRepository.softDelete(id);
    if (!deleteResponse.affected) {
      throw new NotFoundException(`cannot find ${id}`);
    }
  }

  async getNicknameById(id: string) {
    const user = await this.findUserById(id);

    return {
      nickname: user.nickname,
    };
  }

  async updateNicknameById(id: string, newNickname: string) {
    const user = await this.findUserById(id);
    user.nickname = newNickname;
    await this.createOrUpdateUser(user);
    return {
      nickname: user.nickname,
    };
  }

  async getProfImgById(id: string) {
    const user = await this.findUserById(id);

    return {
      profImg: user.profileImage,
    };
  }

  async updateProfImgById(id: string, newProfileImage: string) {
    const user = await this.findUserById(id);
    user.profileImage = newProfileImage;
    await this.createOrUpdateUser(user);
    return {
      profImg: user.profileImage,
    };
  }

  async getTwoFactorAuthenticationById(id: string) {
    const user = await this.findUserById(id);

    return {
      info: user.twoFactorAuthenticationInfo,
      key: user.twoFactorAuthenticationKey,
    };
  }

  async updateTwoFactorAuthenticationById(
    id: string,
    newInfo: string,
    newKey: string,
  ) {
    const user = await this.findUserById(id);

    user.twoFactorAuthenticationInfo = newInfo;
    user.twoFactorAuthenticationKey = newKey;
    await this.createOrUpdateUser(user);

    return {
      info: user.twoFactorAuthenticationInfo,
      key: user.twoFactorAuthenticationKey,
    };
  }

  async deleteTwoFactorAuthenticationById(id: string) {
    const user = await this.findUserById(id);
    user.twoFactorAuthenticationInfo = null;
    user.twoFactorAuthenticationKey = null;
    await this.createOrUpdateUser(user);
  }
}
