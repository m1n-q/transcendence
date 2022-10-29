import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Render,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

//@ ======================================================================== @//
//@
//@    If RmqError occured internally, (for example: 408 for Rmq Request Timeout)
//@    HTTP response will be 500: Internal Server Error,
//@    and 'code' specified in JSON indicates RmqError code.
//@
//@ ======================================================================== @//

@Controller('auth')
export class AuthController {
  constructor(private readonly appService: AuthService) {}

  @Get('signup_view')
  @Render('signup')
  signUpView(
    @Query('provider') provider,
    @Query('thirdPartyId') thirdPartyId,
    @Query('profImg') profImg,
  ) {
    return { provider, thirdPartyId, profImg };
  }

  @Post('signup')
  async signUp(@Body() body) {
    return this.appService.signUp(body);
  }

  @Get('/oauth2/42/result')
  async oauth42Result(@Query('code') code, @Res() res: Response) {
    const gwRes = await this.appService.signIn('42', code);
    if (gwRes && !gwRes.access_token)
      res.redirect(
        `/auth/signup_view?provider=${gwRes.provider}&thirdPartyId=${gwRes.thirdPartyId}&profImg=${gwRes.profImg}`,
      );
    else {
      const { access_token, refresh_token } = gwRes;
      res.cookie('jwt-access', access_token);
      res.cookie('jwt-refresh', refresh_token);
      res.redirect('/main');
    }
  }

  @Get('/oauth2/kakao/result')
  async oauthKakaoResult(@Query('code') code, @Res() res: Response) {
    const gwRes = await this.appService.signIn('kakao', code);
    if (gwRes && !gwRes.access_token)
      res.redirect(
        `/auth/signup_view?provider=${gwRes.provider}&thirdPartyId=${gwRes.thirdPartyId}&profImg=${gwRes.profImg}`,
      );
    else {
      const { access_token, refresh_token } = gwRes;
      res.cookie('jwt-access', access_token);
      res.cookie('jwt-refresh', refresh_token);
      res.redirect('/main');
    }
  }

  @Get('/oauth2/google/result')
  async oauthGoogleResult(@Query('code') code, @Res() res: Response) {
    const gwRes = await this.appService.signIn('google', code);
    if (gwRes && !gwRes.access_token)
      res.redirect(
        `/auth/signup_view?provider=${gwRes.provider}&thirdPartyId=${gwRes.thirdPartyId}&profImg=${gwRes.profImg}`,
      );
    else {
      const { access_token, refresh_token } = gwRes;
      res.cookie('jwt-access', access_token);
      res.cookie('jwt-refresh', refresh_token);
      res.redirect('/main');
    }
  }

  @Get('/oauth2/42')
  async oauth42(@Res() res) {
    res.redirect(this.appService.get42AuthCode());
  }

  @Get('/oauth2/kakao')
  async oauthKakao(@Res() res) {
    res.redirect(this.appService.getKakaoAuthCode());
  }

  @Get('/oauth2/google')
  async oauthGoogle(@Res() res) {
    res.redirect(this.appService.getGoogleAuthCode());
  }
}
