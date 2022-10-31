import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import {
  Controller,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import {
  VerifyAccessJwtRequestDto,
  VerifyRefreshJwtRequestDto,
} from '../dto/verify-jwt-request.dto';
import { RmqResponseInterceptor } from '../../common/rmq/interceptors/rmq-response.interceptor';
import { RmqErrorFactory } from '../../common/rmq/rmq-error.factory';
import { RmqErrorHandler } from '../../common/rmq/rmq-error.handler';

@UseInterceptors(RmqResponseInterceptor)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,

    exceptionFactory: RmqErrorFactory('auth-service'),
  }),
)
@Controller('auth-rmq')
export class AuthRmqController {
  constructor(private readonly authService: AuthService) {}

  @RabbitRPC({
    exchange: 'auth.d.x',
    queue: 'auth.verify.jwt.q',
    routingKey: 'auth.verify.jwt.rk',
    errorHandler: RmqErrorHandler,
  })
  async verifyJwt(msg: VerifyAccessJwtRequestDto) {
    return this.authService.verifyJwt(msg, process.env.JWT_ACCESS_SECRET);
  }

  @RabbitRPC({
    exchange: 'auth.d.x',
    queue: 'auth.refresh.jwt.q',
    routingKey: 'auth.refresh.jwt.rk',
    errorHandler: RmqErrorHandler,
  })
  async refresh(msg: VerifyRefreshJwtRequestDto) {
    return this.authService.refresh(
      msg.refresh_token,
      process.env.JWT_REFRESH_SECRET,
    );
  }

  @RabbitRPC({
    exchange: 'auth.d.x',
    queue: 'auth.signin.42.q',
    routingKey: 'auth.signin.42.rk',
    errorHandler: RmqErrorHandler,
  })
  async oauth42(msg: { code: string }) {
    const userProfile: any = await this.authService.oauth(
      msg.code,
      {
        contentType: 'json',
        clientID: process.env.OAUTH2_42_ID,
        clientSecret: process.env.OAUTH2_42_SECRET,
        tokenURI: 'https://api.intra.42.fr/oauth/token',
        redirectURI: 'http://localhost:56789/auth/oauth2/42/result',
        endpoint: `https://api.intra.42.fr/v2/me`,
      },
      ['id', 'image_url'],
    );

    const { id: thirdPartyId, image_url: profImg } = userProfile;

    try {
      // TODO: return additional info: {profImg, locale} if user not exists
      // return this.authService.signInIfExists({ provider: '42', thirdPartyId });
      const res = await this.authService.signInIfExists({
        provider: '42',
        thirdPartyId,
      });
      if (res['provider']) res['profImg'] = profImg;
      return res;
    } catch (e) {
      throw e;
    }
  }

  @RabbitRPC({
    exchange: 'auth.d.x',
    queue: 'auth.signin.kakao.q',
    routingKey: 'auth.signin.kakao.rk',
    errorHandler: RmqErrorHandler,
  })
  async oauthKakao(msg: { code: string }) {
    const userProfile: any = await this.authService.oauth(
      msg.code,
      {
        contentType: 'x-www-form-urlencoded',
        clientID: process.env.OAUTH2_KAKAO_ID,
        clientSecret: process.env.OAUTH2_KAKAO_SECRET,
        tokenURI: 'https://kauth.kakao.com/oauth/token',
        redirectURI: 'http://localhost:56789/auth/oauth2/kakao/result',
        endpoint: 'https://kapi.kakao.com/v2/user/me',
      },
      ['id', 'kakao_account'],
    );

    const {
      id: thirdPartyId,
      kakao_account: {
        profile: { profile_image_url: profImg },
      },
    } = userProfile;

    try {
      // TODO: return additional info: {profImg, locale} if user not exists
      // return this.authService.signInIfExists({ provider: '', thirdPartyId });
      const res = this.authService.signInIfExists({
        provider: 'kakao',
        thirdPartyId,
      });
      if (res['provider']) res['profImg'] = profImg;
      return res;
    } catch (e) {
      throw e;
    }
  }

  @RabbitRPC({
    exchange: 'auth.d.x',
    queue: 'auth.signin.google.q',
    routingKey: 'auth.signin.google.rk',
    errorHandler: RmqErrorHandler,
  })
  async oauthGoogle(msg: { code: string }) {
    const userProfile: any = await this.authService.oauth(
      msg.code,
      {
        contentType: 'json',
        clientID: process.env.OAUTH2_GOOGLE_ID,
        clientSecret: process.env.OAUTH2_GOOGLE_SECRET,
        tokenURI: 'https://www.googleapis.com/oauth2/v4/token',
        redirectURI: 'http://localhost:56789/auth/oauth2/google/result',
        endpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
      },
      ['id', 'picture', 'locale'],
    );

    const { id: thirdPartyId, picture: profImg, locale } = userProfile;

    try {
      // TODO: return additional info: {profImg, locale} if user not exists
      // return this.authService.signInIfExists({ provider: 'google', thirdPartyId });
      const res = this.authService.signInIfExists({
        provider: 'google',
        thirdPartyId,
      });
      if (res['provider']) res['profImg'] = profImg;
      return res;
    } catch (e) {
      throw e;
    }
  }
}
