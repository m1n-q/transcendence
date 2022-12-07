import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Controller, UseInterceptors } from '@nestjs/common';
import { RmqResponseInterceptor } from 'src/common/rmq/interceptors/rmq-response.interceptor';
import { RmqErrorHandler } from 'src/common/rmq/rmq-error.handler';
import { DeleteTwoFactorAuthenticationDto } from '../dto/delete-2fa-dto';
import { UpdateTwoFactorAuthenticationDto } from '../dto/update-2fa-dto';
import { TwoFactorAuthenticationService } from '../services/two-factor-authentication.service';

@UseInterceptors(new RmqResponseInterceptor())
@Controller('2fa-rmq')
export class TwoFactorAuthenticationRmqController {
  constructor(
    private readonly twoFactorAuthenticationService: TwoFactorAuthenticationService,
  ) {}

  @RabbitRPC({
    exchange: 'auth.d.x',
    queue: 'auth.2fa.generate.q',
    routingKey: 'req.to.auth.2fa.generate.rk',
    errorHandler: RmqErrorHandler,
  })
  async twoFactorAuthenticateGenerate(msg: { user_id: string }) {
    return await this.twoFactorAuthenticationService.generateTwoFactorAuthenticationSecret(
      msg.user_id,
    );
  }

  @RabbitRPC({
    exchange: 'auth.d.x',
    queue: 'auth.update.2fa.enable.q',
    routingKey: 'req.to.auth.update.2fa.enable.rk',
    errorHandler: RmqErrorHandler,
  })
  async updateTwoFactorAuthentication(msg: UpdateTwoFactorAuthenticationDto) {
    return await this.twoFactorAuthenticationService.updateTwoFactorAuthentication(
      msg.twoFactorAuthenticationCode,
      msg.user,
      msg.is_two_factor_authentication_enable,
    );
  }

  @RabbitRPC({
    exchange: 'auth.d.x',
    queue: 'auth.delete.2fa.q',
    routingKey: 'req.to.auth.delete.2fa.rk',
    errorHandler: RmqErrorHandler,
  })
  async deleteTwoFactorAuthentication(msg: DeleteTwoFactorAuthenticationDto) {
    return await this.twoFactorAuthenticationService.deleteTwoFactorAuthentication(
      msg.twoFactorAuthenticationCode,
      msg.user,
    );
  }
}
