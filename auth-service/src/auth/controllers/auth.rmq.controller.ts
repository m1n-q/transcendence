import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import {
  Controller,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import {
  Tokens,
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
    routingKey: 'req.to.auth.verify.jwt.rk',
    errorHandler: RmqErrorHandler,
  })
  async verifyJwt(msg: VerifyAccessJwtRequestDto) {
    return this.authService.verifyJwt(msg, process.env.JWT_ACCESS_SECRET);
  }

  @RabbitRPC({
    exchange: 'auth.d.x',
    queue: 'auth.refresh.jwt.q',
    routingKey: 'req.to.auth.refresh.jwt.rk',
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
    routingKey: 'req.to.auth.signin.42.rk',
    errorHandler: RmqErrorHandler,
  })
  async oauth42(msg: { code: string }) {
    return this.authService.oauth42(msg.code);
  }

  @RabbitRPC({
    exchange: 'auth.d.x',
    queue: 'auth.signin.kakao.q',
    routingKey: 'req.to.auth.signin.kakao.rk',
    errorHandler: RmqErrorHandler,
  })
  async oauthKakao(msg: { code: string }) {
    return this.authService.oauthKakao(msg.code);
  }

  @RabbitRPC({
    exchange: 'auth.d.x',
    queue: 'auth.signin.google.q',
    routingKey: 'req.to.auth.signin.google.rk',
    errorHandler: RmqErrorHandler,
  })
  async oauthGoogle(msg: { code: string }) {
    return this.authService.oauthGoogle(msg.code);
  }

  @RabbitRPC({
    exchange: 'auth.d.x',
    queue: 'auth.signout.q',
    routingKey: 'req.to.auth.signout.rk',
    errorHandler: RmqErrorHandler,
  })
  async signOut(msg: VerifyRefreshJwtRequestDto) {
    return this.authService.signOut(msg.refresh_token);
  }
}
