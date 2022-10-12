import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from './redis/services/redis.service';
import { UserInfoDto } from './dto/user-info.dto';
import { ThirdPartyInfoDto } from './dto/third-party-info.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
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
}
