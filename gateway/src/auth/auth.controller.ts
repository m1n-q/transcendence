import { AuthService } from './auth.service';
import { Body, Controller, Param, Post } from '@nestjs/common';

type Provider = 'kakao' | '42' | 'google';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //TODO: param validation
  @Post('/oauth2/:provider')
  async oauth(@Body('code') code, @Param('provider') provider: Provider) {
    return this.authService.requestSignIn(provider, code); // 가입되어 있다면 {access_token, refresth_token} (jwt), 아닐 시 RmqError(404)가 리턴됩니다
  }

  @Post('/refresh')
  async refresh(@Body('refresh_token') token) {
    return this.authService.requestRefresh(token);
  }
}
