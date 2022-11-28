import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../redis-module/services/redis.service';
import { ThirdPartyInfo } from '../dto/third-party-info';
import {
  Tokens,
  VerifyAccessJwtRequestDto,
  VerifyRefreshJwtRequestDto,
} from '../dto/verify-jwt-request.dto';
import { RmqError } from '../../common/rmq/types/rmq-error';
import { plainToInstance } from 'class-transformer';
import { UserService } from '../../user/services/user.service';
import { URLSearchParams } from 'url';
import { UserInfo } from '../../user/types/user-info';

const WHERE = 'auth-service';
// const AT_EXPIRES_IN = 60 * 15;
const AT_EXPIRES_IN = 60 * 60;
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
    private readonly userService: UserService,
  ) {}

  makeUserKey(user_id: string) {
    return 'user:' + user_id;
  }
  /* if cannot find user with given third-party info, return those info for signing up */
  async signInIfExists(thirdPartyInfo: ThirdPartyInfo) {
    let userInfo: UserInfo;

    try {
      userInfo = await this.userService.requestUserInfoBy3pId(thirdPartyInfo);
    } catch (e) {
      throw e;
    }

    return this.signIn(userInfo);
  }

  //TODO: check redis response
  /* issue access_token and refresh_token */
  async signIn(userInfo: UserInfo) {
    const access_token = this.issueAccessToken(userInfo);
    const refresh_token = this.issueRefreshToken(userInfo);

    /* override existing refresh_token. only one refresh_token per userId */
    const res: any[] = await this.storeRefreshToken(
      this.makeUserKey(userInfo.user_id),
      refresh_token,
      RT_EXPIRES_IN,
    );

    return { access_token, refresh_token };
  }

  /* remove refresh_token mapping from redis */
  async signOut(refreshToken) {
    let userInfo: UserInfo;
    try {
      userInfo = await this.verifyJwt(
        { refresh_token: refreshToken },
        process.env.JWT_REFRESH_SECRET,
      );
    } catch (e) {
      /* if verify failed due to expiry date, token already removed from redis */
      e.message = 'Invalid token, or already signed out';
      throw e;
    }

    this.redisService.hdel(this.makeUserKey(userInfo.user_id), 'refresh_token');
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

  issueAccessToken(payload: UserInfo) {
    return this.jwtService.sign(Object.assign({}, payload), {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: AT_EXPIRES_IN,
    });
  }

  issueRefreshToken(payload: UserInfo) {
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

    if (!token)
      throw new RmqError({
        code: 400,
        message: 'Invalid request',
        where: WHERE,
      });

    try {
      payload = this.jwtService.verify(token, {
        secret,
      });
    } catch (e) {
      throw new RmqError({
        code: 401,
        message: 'Invalid token',
        where: WHERE,
      });
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

    const userInfo = plainToInstance(UserInfo, payload, {
      excludeExtraneousValues: true,
    });

    const hashed = await this.redisService.hget(
      this.makeUserKey(userInfo.user_id),
      'refresh_token',
    );

    const result = refreshToken === hashed;
    if (result == false)
      throw new RmqError({
        code: 401,
        message: 'Refresh token not matches',
        where: WHERE,
      });
    return this.signIn(userInfo);
  }

  /* get access_token, refresh_token of resource server */
  async getOauthTokens(authorization_code: string, param: OauthParam) {
    let res: Response;

    let body: any = {
      grant_type: 'authorization_code',
      code: authorization_code,
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
        throw new RmqError({
          code: res.status,
          message: res.statusText,
          where: `auth-service#getOauthTokens()`,
        });
    } catch (e) {
      if (e.code) throw e;
      /* network fail */
      throw new RmqError({
        code: 500,
        message: 'fetch fail',
        where: `auth-service#getOauthTokens()`,
      });
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
        throw new RmqError({
          code: res.status,
          message: res.statusText,
          where: `auth-service#getOauthResources()`,
        });
    } catch (e) {
      if (e.code) throw e;
      /* network fail */
      throw new RmqError({
        code: 500,
        message: 'fetch fail',
        where: `auth-service#getOauthResources()`,
      });
    }
    const userProfile = await res.json();
    return userProfile;
  }

  /* grant authorization code and get tokens, and request resources with the tokens */
  async oauth(
    authorization_code: string,
    param: OauthParam,
    resources: string[],
  ): Promise<any> {
    const ret: any = {};
    const { access_token, refresh_token } = await this.getOauthTokens(
      authorization_code,
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

  async oauth42(authorization_code: string) {
    const provider = '42';
    const userProfile: any = await this.oauth(
      authorization_code,
      {
        contentType: 'json',
        clientID: process.env.OAUTH2_42_ID,
        clientSecret: process.env.OAUTH2_42_SECRET,
        tokenURI: 'https://api.intra.42.fr/oauth/token',
        redirectURI: process.env.OAUTH2_REDIRECT_URI + provider,
        endpoint: `https://api.intra.42.fr/v2/me`,
      },
      ['id', 'image_url', 'campus'],
    );

    const { id: third_party_id, image_url: prof_img, campus } = userProfile;
    const locale: string = campus[0].language.name
      .substring(0, 2)
      .toLowerCase();

    try {
      return await this.signInIfExists({
        provider,
        third_party_id,
      });
    } catch (e) {
      if (e.code === 404)
        return {
          provider,
          third_party_id: third_party_id.toString(),
          prof_img,
          locale,
        };

      throw e;
    }
  }

  async oauthKakao(authorization_code: string) {
    const provider = 'kakao';
    const userProfile: any = await this.oauth(
      authorization_code,
      {
        contentType: 'x-www-form-urlencoded',
        clientID: process.env.OAUTH2_KAKAO_ID,
        clientSecret: process.env.OAUTH2_KAKAO_SECRET,
        tokenURI: 'https://kauth.kakao.com/oauth/token',
        redirectURI: process.env.OAUTH2_REDIRECT_URI + provider,
        endpoint: 'https://kapi.kakao.com/v2/user/me',
      },
      ['id', 'kakao_account'],
    );

    const {
      id: third_party_id,
      kakao_account: {
        profile: { profile_image_url: prof_img },
      },
    } = userProfile;

    try {
      return await this.signInIfExists({
        provider,
        third_party_id,
      });
    } catch (e) {
      if (e.code === 404)
        return {
          provider,
          third_party_id: third_party_id.toString(),
          prof_img,
          locale: 'ko',
        };

      throw e;
    }
  }

  async oauthGoogle(authorization_code: string) {
    const provider = 'google';
    const userProfile: any = await this.oauth(
      authorization_code,
      {
        contentType: 'json',
        clientID: process.env.OAUTH2_GOOGLE_ID,
        clientSecret: process.env.OAUTH2_GOOGLE_SECRET,
        tokenURI: 'https://www.googleapis.com/oauth2/v4/token',
        redirectURI: process.env.OAUTH2_REDIRECT_URI + provider,
        endpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
      },
      ['id', 'picture', 'locale'],
    );

    const { id: third_party_id, picture: prof_img, locale } = userProfile;

    try {
      return await this.signInIfExists({
        provider,
        third_party_id,
      });
    } catch (e) {
      if (e.code === 404)
        return {
          provider,
          third_party_id: third_party_id.toString(),
          prof_img,
          locale,
        };

      throw e;
    }
  }
}
