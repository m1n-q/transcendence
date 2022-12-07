import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserInfo } from 'src/user/user-info';
import { UserService } from 'src/user/user.service';
import { RmqResponse } from '../common/rmq/types/rmq-response';
@Injectable()
export class AuthService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly userService: UserService,
  ) {}

  async requestSignIn(provider: string, code: string) {
    let response: RmqResponse<Tokens>;
    type Tokens = { access_token: string; refresh_token: string };
    try {
      response = await this.amqpConnection.request<RmqResponse<Tokens>>({
        exchange: process.env.RMQ_AUTH_DIRECT,
        routingKey: `req.to.auth.signin.${provider}.rk`,
        payload: { authorization_code: code },
      });
    } catch (reqFail) {
      throw new InternalServerErrorException('request to auth-service failed');
    }
    if (!response.success)
      throw new HttpException(
        `${response.error.message} / where: ${response.error.where}`,
        response.error.code,
      );
    return response.data;
  }

  async requestRefresh(token) {
    let response: RmqResponse<Tokens>;
    type Tokens = { access_token: string; refresh_token: string };
    try {
      response = await this.amqpConnection.request<RmqResponse<Tokens>>({
        exchange: process.env.RMQ_AUTH_DIRECT,
        routingKey: 'req.to.auth.refresh.jwt.rk',
        payload: { refresh_token: token },
      });
    } catch (reqFail) {
      throw new InternalServerErrorException('request to auth-service failed');
    }
    if (!response.success)
      throw new HttpException(
        `${response.error.message} / where: ${response.error.where}`,
        response.error.code,
      );
    return response.data;
  }
  async register2FA(user_id: string) {
    const user = await this.userService.getUserById(user_id);
    if (user.two_factor_authentication_key !== null) {
      throw new HttpException('already register 2fa', 409);
    }
    let response: RmqResponse<string>;
    try {
      response = await this.amqpConnection.request<RmqResponse<string>>({
        exchange: process.env.RMQ_AUTH_DIRECT,
        routingKey: 'req.to.auth.2fa.generate.rk',
        payload: { user_id },
      });
    } catch (reqFail) {
      throw new InternalServerErrorException('request to auth-service failed');
    }
    if (!response.success)
      throw new HttpException(
        `${response.error.message} / where: ${response.error.where}`,
        response.error.code,
      );
    return response.data;
  }

  async updateTwoFactorAuthenticationEnable(
    user_id: string,
    twoFactorAuthenticationCode: string,
    is_two_factor_authentication_enable: boolean,
  ) {
    const user: UserInfo = await this.userService.getUserById(user_id);
    if (
      user.is_two_factor_authentication_enable ===
      is_two_factor_authentication_enable
    ) {
      throw new HttpException('already changed 2fa on/off', 409);
    }
    let response: RmqResponse;
    try {
      response = await this.amqpConnection.request<RmqResponse>({
        exchange: process.env.RMQ_AUTH_DIRECT,
        routingKey: 'req.to.auth.update.2fa.enable.rk',
        payload: {
          twoFactorAuthenticationCode,
          user,
          is_two_factor_authentication_enable,
        },
      });
    } catch (reqFail) {
      throw new InternalServerErrorException('request to auth-service failed');
    }
    if (!response.success)
      throw new HttpException(
        `${response.error.message} / where: ${response.error.where}`,
        response.error.code,
      );
    return;
  }

  async deleteTwoFactorAuthenticationEnable(
    user_id: string,
    twoFactorAuthenticationCode: string,
  ) {
    const user: UserInfo = await this.userService.getUserById(user_id);
    let response: RmqResponse;
    try {
      response = await this.amqpConnection.request<RmqResponse>({
        exchange: process.env.RMQ_AUTH_DIRECT,
        routingKey: 'req.to.auth.delete.2fa.rk',
        payload: {
          twoFactorAuthenticationCode,
          user,
        },
      });
    } catch (reqFail) {
      throw new InternalServerErrorException('request to auth-service failed');
    }
    if (!response.success)
      throw new HttpException(
        `${response.error.message} / where: ${response.error.where}`,
        response.error.code,
      );
    return;
  }
}
