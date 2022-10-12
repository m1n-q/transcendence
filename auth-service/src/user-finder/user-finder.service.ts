import { Injectable } from '@nestjs/common';
import { RmqResponse } from '../dto/rmq-response';
import { ThirdPartyInfoDto } from '../dto/third-party-info.dto';
import { UserInfoDto } from '../dto/user-info.dto';
import { RmqService } from '../rmq/services/rmq.service';

@Injectable()
export class UserFinderService {
  constructor(private readonly rmqService: RmqService) {}

  async findUserBy3pId(thirdPartyInfo: ThirdPartyInfoDto) {
    let response: RmqResponse<UserInfoDto>;
    try {
      response = await this.rmqService.requestUserInfoBy3pId(thirdPartyInfo);
    } catch (reqFail) {
      throw reqFail;
    }
    if (response.success) return response.data;
    return null;
  }

  async findUserById(userId: string) {
    let response: RmqResponse<UserInfoDto>;

    try {
      response = await this.rmqService.requestUserInfoById(userId);
    } catch (reqFail) {
      throw reqFail;
    }
    if (response.success) return response.data;
    return null;
  }
}
