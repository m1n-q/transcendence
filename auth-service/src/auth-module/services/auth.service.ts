import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../redis-module/services/redis.service';
import { UserInfoDto } from '../../dto/user-info.dto';
import { ThirdPartyInfoDto } from '../../dto/third-party-info.dto';
import {
  VerifyAccessJwtRequestDto,
  VerifyRefreshJwtRequestDto,
} from '../../dto/verify-jwt-request.dto';
import { RmqError } from '../../dto/rmq-error';
import { plainToInstance } from 'class-transformer';

const WHERE = 'auth-service';
const AT_EXPIRES_IN = 60 * 15;
const RT_EXPIRES_IN = 60 * 60 * 24 * 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async signIn(userInfo: UserInfoDto) {
    const access_token = this.issueAccessToken(userInfo);
    const refresh_token = this.issueRefreshToken(userInfo);

    //TODO: check redis response
    const res: any[] = await this.storeRefreshToken(
      'user:' + userInfo.userId,
      refresh_token,
      RT_EXPIRES_IN,
    );

    return { access_token, refresh_token };
  }

  async signUp(thirdPartyInfo: ThirdPartyInfoDto) {
    return `redirect to signUp page.
    ${thirdPartyInfo.provider}, ${thirdPartyInfo.thirdPartyId}`;
  }

  async storeRefreshToken(key, refreshToken, TTL) {
    const res = await this.redisService.hsetWithTTL(
      key,
      'refresh_token',
      refreshToken,
      TTL,
    );
    return res;
  }

  issueAccessToken(payload: UserInfoDto) {
    return this.jwtService.sign(Object.assign({}, payload), {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: AT_EXPIRES_IN,
    });
  }

  issueRefreshToken(payload: UserInfoDto) {
    const refreshToken = this.jwtService.sign(Object.assign({}, payload), {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: RT_EXPIRES_IN,
    });
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

    if (!token) throw new RmqError(400, 'Invalid request', WHERE);

    try {
      payload = this.jwtService.verify(token, {
        secret,
      });
    } catch (e) {
      throw new RmqError(401, 'Invalid token', WHERE);
    }
    return payload;
  }

  async refresh(refreshToken, secret) {
    let payload;
    try {
      payload = await this.verifyJwt({ refresh_token: refreshToken }, secret);
    } catch (e) {
      throw e;
    }

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
      throw new RmqError(401, 'Refresh token not matches', WHERE);
    return this.signIn(userInfo);
  }
}
