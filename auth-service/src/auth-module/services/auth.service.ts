import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../redis-module/services/redis.service';
import { UserInfoDto } from '../../dto/user-info.dto';
import { ThirdPartyInfoDto } from '../../dto/third-party-info.dto';
import { UserFinderService } from '../../user-finder/services/user-finder.service';
import {
  VerifyAccessJwtRequestDto,
  VerifyRefreshJwtRequestDto,
} from '../../dto/verify-jwt-request.dto';
import { RmqError } from '../../dto/rmq-response';
import { plainToInstance } from 'class-transformer';

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
    return this.jwtService.sign(Object.assign({}, payload), {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: 60 * 15,
    });
  }

  issueRefreshToken(payload: UserInfoDto) {
    const refreshToken = this.jwtService.sign(Object.assign({}, payload), {
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

  async verifyJwt(
    msg: VerifyAccessJwtRequestDto | VerifyRefreshJwtRequestDto,
    secret,
  ) {
    let payload;
    const token = msg['access_token']
      ? msg['access_token']
      : msg['refresh_token'];

    if (!token) return new RmqError(400, 'Invalid request', WHERE);

    try {
      payload = this.jwtService.verify(token, {
        secret,
      });
    } catch (e) {
      return new RmqError(401, 'Invalid token', WHERE);
    }
    return payload;
  }

  async refresh(refreshToken, secret) {
    const payload = await this.verifyJwt(
      { refresh_token: refreshToken },
      secret,
    );
    if (payload instanceof RmqError) return payload;

    const userInfo = plainToInstance(UserInfoDto, payload, {
      excludeExtraneousValues: true,
    });

    const hashed = await this.redisService.hget(
      'user:' + userInfo.userId,
      'refresh_token',
    );

    //TODO: hash
    const result = refreshToken === hashed;
    if (result == false)
      return new RmqError(401, 'Refresh token not matches', WHERE);
    return {
      access_token: this.issueAccessToken(userInfo),
      refresh_token: this.issueRefreshToken(userInfo),
    };
  }
}
