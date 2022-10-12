import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from './redis/services/redis.service';
import { UserInfoDto } from './dto/user-info.dto';
import { ThirdPartyInfoDto } from './dto/third-party-info.dto';
import { UserFinderService } from './user-finder/user-finder.service';
import { VerifyJwtRequestDto } from './dto/verify-jwt-request.dto';
import { RmqError, RmqResponse } from './dto/rmq-response';

const WHERE = 'auth-service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly userFinderService: UserFinderService,
  ) {}

  async signIn(userInfo: UserInfoDto) {
    return {
      access_token: this.issueAccessToken(userInfo),
      refresh_token: this.issueRefreshToken(userInfo),
    };
  }
  async signUp(thirdPartyInfo: ThirdPartyInfoDto) {
    return `redirect to signUp page.
    ${thirdPartyInfo.provider}, ${thirdPartyInfo.thirdPartyId}`;
  }

  issueAccessToken(payload: UserInfoDto) {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: 60 * 15,
    });
  }

  issueRefreshToken(payload: UserInfoDto) {
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: 60 * 60 * 24 * 7,
    });
    this.redisService.hset(
      'user:' + payload.userId,
      'refresh_token',
      //TODO: hash
      refreshToken,
    );
    return refreshToken;
  }

  async refresh(userInfo: UserInfoDto, refreshToken) {
    const hashed = await this.redisService.hget(
      'user:' + userInfo.userId,
      'refresh_token',
    );

    //TODO: hash
    const result = refreshToken === hashed;
    if (result == false)
      throw new UnauthorizedException('refresh fail: invalid rt');

    return {
      access_token: this.issueAccessToken(userInfo),
      refresh_token: this.issueRefreshToken(userInfo),
    };
  }

  async verifyJwt(msg: VerifyJwtRequestDto) {
    let payload;
    let userInfo: UserInfoDto;

    try {
      payload = this.jwtService.verify(msg.access_token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch (e) {
      return new RmqError(401, 'Invalid access_token', WHERE);
    }

    try {
      userInfo = await this.userFinderService.findUserById(payload.userId);
    } catch (reqFail) {
      return new RmqError(reqFail.code, reqFail.message, reqFail.where);
    }

    if (!userInfo)
      return new RmqError(401, 'Invalid userId in jwt payload', WHERE);
    return true;
  }
}
