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
  constructor(private readonly authService: AuthService) {}

  @Get('signup_view')
  @Render('signup')
  signUpView(
    @Query('provider') provider,
    @Query('third_party_id') third_party_id,
    @Query('prof_img') prof_img,
  ) {
    return { provider, third_party_id, prof_img };
  }

  @Post('signup')
  async signUp(@Body() body) {
    return this.authService.signUp(body);
  }

  @Get('/oauth2/42')
  async oauth42(@Res() res) {
    res.redirect(this.authService.get42AuthCode());
  }

  @Get('/oauth2/kakao')
  async oauthKakao(@Res() res) {
    res.redirect(this.authService.getKakaoAuthCode());
  }

  @Get('/oauth2/google')
  async oauthGoogle(@Res() res) {
    res.redirect(this.authService.getGoogleAuthCode());
  }
}
