import { AuthService } from './auth.service';
import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/http/guard/auth.guard';

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
  @Post('/2fa/generate')
  @UseGuards(AuthGuard)
  async register2FA(@Req() req) {
    return await this.authService.register2FA(req.user.user_id);
  }

  @Post('/2fa/turn-on')
  @UseGuards(AuthGuard)
  async turnOnTwoFactorAuthentication(
    @Req() req,
    @Body('two_factor_authentication_code') twoFactorAuthenticationCode: string,
  ) {
    return await this.authService.updateTwoFactorAuthenticationEnable(
      req.user.user_id,
      twoFactorAuthenticationCode,
      true,
    );
  }

  @Post('/2fa/turn-off')
  @UseGuards(AuthGuard)
  async turnOffTwoFactorAuthentication(
    @Req() req,
    @Body('two_factor_authentication_code') twoFactorAuthenticationCode: string,
  ) {
    return await this.authService.updateTwoFactorAuthenticationEnable(
      req.user.user_id,
      twoFactorAuthenticationCode,
      false,
    );
  }

  @Post('/2fa/delete')
  @UseGuards(AuthGuard)
  async removeTwoFactorAuthentication(
    @Req() req,
    @Body('two_factor_authentication_code') twoFactorAuthenticationCode: string,
  ) {
    return await this.authService.deleteTwoFactorAuthenticationEnable(
      req.user.user_id,
      twoFactorAuthenticationCode,
    );
  }
}
