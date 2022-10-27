import {
  Controller,
  Get,
  Query,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AmqpConnection, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import {
  VerifyAccessJwtRequestDto,
  VerifyRefreshJwtRequestDto,
} from '../../dto/verify-jwt-request.dto';
import { RmqResponseInterceptor } from '../../interceptors/rmq-response.interceptor';
import { RmqErrorFactory } from '../../rmq-error.factory';
import { RmqErrorHandler } from '../../rmq-error.handler';

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
  constructor(
    private readonly authService: AuthService,
    private readonly a: AmqpConnection /* XXX */,
  ) {}

  // XXX: issue temp rt
  @Get('rt')
  async rt(@Query() q) {
    return this.authService.issueRefreshToken({
      userId: 'mishin',
      nickname: 'ping',
      profImg: 'abcd.com',
      mmr: 1234,
    });
  }

  // XXX: send message to auth.refresh.jwt.q
  @Get('rf')
  async rf(@Query() q) {
    return this.a.request({
      exchange: 'auth.d.x',
      routingKey: 'auth.refresh.jwt.rk',
      payload: q,
    });
  }

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
}
