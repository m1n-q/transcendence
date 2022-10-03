import { CreateUserRequestDto } from './dto/create.user.request.dto';
import {
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
    await this.userRepository.save(user);

    return {
      userId: user.id,
      nickname: user.nickname,
      createdatedDate: user.createdDate,
    };
  }

  async getById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user || user.deletedDate != null) {
      throw new NotFoundException(`cannot find ${id}`);
    }

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
    const deleteResponse = await this.userRepository.softDelete(id);
    console.log(deleteResponse);
    if (!deleteResponse.affected) {
      throw new NotFoundException(`cannot find ${id}`);
    }
  }
}
