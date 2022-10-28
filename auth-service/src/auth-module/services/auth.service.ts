import { Injectable } from '@nestjs/common';
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
import { RmqService } from '../../rmq-module/services/rmq.service';
import { URLSearchParams } from 'url';

const WHERE = 'auth-service';
const AT_EXPIRES_IN = 60 * 15;
const RT_EXPIRES_IN = 60 * 60 * 24 * 7;
type OauthParam = {
  contentType: 'json' | 'x-www-form-urlencoded';
  clientID: string;
  clientSecret: string;
  tokenURI: string;
  redirectURI: string;
  endpoint: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly rmqService: RmqService,
  ) {}

  /* if cannot find user with given third-party info, return those info for signing up */
  async signInIfExists(thirdPartyInfo: ThirdPartyInfoDto) {
    let userInfo: UserInfoDto;

    try {
      userInfo = await this.rmqService.requestUserInfoBy3pId(thirdPartyInfo);
    } catch (e) {
      if (e.code === 404) return thirdPartyInfo;
      throw e;
    }

    return this.signIn(userInfo);
  }

  /* issue access_token and refresh_token */
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

  /* store refresh token mapped with userId */
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

  /* verify jwt and return its payload (user info)  */
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

  /* if received token matches the value stored in DB, re-issue tokens */
  //TODO: hash when storing
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

    const result = refreshToken === hashed;
    if (result == false)
      throw new RmqError(401, 'Refresh token not matches', WHERE);
    return this.signIn(userInfo);
  }

  /* get access_token, refresh_token of resource server */
  async getOauthTokens(code: string, param: OauthParam) {
    let res: Response;

    let body: any = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: param.redirectURI,
      client_id: param.clientID,
      client_secret: param.clientSecret,
    };

    switch (param.contentType) {
      case 'json':
        body = JSON.stringify(body);
        break;
      case 'x-www-form-urlencoded':
        body = new URLSearchParams(body);
        break;
      default:
    }

    try {
      res = await fetch(param.tokenURI, {
        method: 'POST',
        headers: {
          'Content-type': `application/${param.contentType}` /* kakao는 x-www-form-urlencoded을 쓰네;;; */,
        },
        body: body,
      });
      /* request fail */
      if (!res.ok)
        throw new RmqError(
          res.status,
          res.statusText,
          // await res.text(),
          `auth-service#getOauthTokens()`,
        );
    } catch (e) {
      if (e.code) throw e;
      /* network fail */
      throw new RmqError(500, 'fetch fail', `auth-service#getOauthTokens()`);
    }

    const tokens = await res.json();
    return tokens;
  }

  /* get resource owner's information */
  async getOauthResources(accessToken: string, endpoint: string) {
    let res;

    try {
      res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      /* request fail */
      if (!res.ok)
        throw new RmqError(
          res.status,
          res.statusText,
          `auth-service#getOauthResources()`,
        );
    } catch (e) {
      if (e.code) throw e;
      /* network fail */
      throw new RmqError(500, 'fetch fail', `auth-service#getOauthResources()`);
    }
    const userProfile = await res.json();
    return userProfile;
  }

  /* grant authorization code and get tokens, and request resources with the tokens */
  async oauth(
    code: string,
    param: OauthParam,
    resources: string[],
  ): Promise<any> {
    const ret: any = {};

    const { access_token, refresh_token } = await this.getOauthTokens(
      code,
      param,
    );
    const userProfile = await this.getOauthResources(
      access_token,
      param.endpoint,
    );

    for (const r of resources) {
      ret[r] = userProfile[r];
    }

    return ret;
  }
}
