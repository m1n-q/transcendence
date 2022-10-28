import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../../dto/create-user.dto';
import { ThirdPartyInfoDto } from '../../dto/third-party-info.dto';
import { UserInfoDto } from '../../dto/user-info.dto';
import { RmqService } from '../../rmq-module/services/rmq.service';

@Injectable()
export class UserService {
  constructor(private readonly rmqService: RmqService) {}

  async findUserBy3pId(thirdPartyInfo: ThirdPartyInfoDto) {
    let userInfo: UserInfoDto;
    try {
      userInfo = await this.rmqService.requestUserInfoBy3pId(thirdPartyInfo);
    } catch (e) {
      if (e.code == 404) return null;
      throw e;
    }
    return userInfo;
  }

  async findUserById(userId: string) {
    let userInfo: UserInfoDto;

    try {
      userInfo = await this.rmqService.requestUserInfoById(userId);
    } catch (e) {
      if (e.code == 404) return null;
      throw e;
    }
    return userInfo;
  }

  async createUser(data: CreateUserDto) {
    let userInfo: UserInfoDto;

    try {
      userInfo = await this.rmqService.requestCreateUser(data);
    } catch (e) {
      throw e;
    }
    return userInfo;
  }
}
