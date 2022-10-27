import { Injectable } from '@nestjs/common';
import { ThirdPartyInfoDto } from '../../dto/third-party-info.dto';
import { UserInfoDto } from '../../dto/user-info.dto';
import { RmqService } from '../../rmq-module/services/rmq.service';

@Injectable()
export class UserFinderService {
  constructor(private readonly rmqService: RmqService) {}

  async findUserBy3pId(thirdPartyInfo: ThirdPartyInfoDto) {
    let userInfo: UserInfoDto;
    try {
      userInfo = await this.rmqService.requestUserInfoBy3pId(thirdPartyInfo);
    } catch (e) {
      if (e.status == 400) return null;
      throw e;
    }
    return userInfo;
  }

  async findUserById(userId: string) {
    let userInfo: UserInfoDto;

    try {
      userInfo = await this.rmqService.requestUserInfoById(userId);
    } catch (e) {
      if (e.status == 400) return null;
      throw e;
    }
    return userInfo;
  }
}
