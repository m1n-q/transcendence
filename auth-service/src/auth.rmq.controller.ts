import { Controller, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { VerifyJwtRequestDto } from './dto/verify-jwt-request.dto';
import { RmqResponseInterceptor } from './rmq-response.interceptor';

@Controller('auth-rmq')
export class AuthRmqController {
  constructor(private readonly authService: AuthService) {}

  @UseInterceptors(RmqResponseInterceptor)
  @RabbitRPC({
    exchange: 'auth.d.x',
    queue: 'auth.verify.jwt.q',
    routingKey: 'auth.verify.jwt.rk',
  })
  async verifyJwt(msg: VerifyJwtRequestDto) {
    return this.authService.verifyJwt(msg);
  }
}
