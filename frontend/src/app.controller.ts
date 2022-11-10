import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Redirect,
  Render,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller()
export class AppController {
  constructor(private readonly authService: AuthService) {}
  @Get()
  @Redirect('/main')
  m(@Req() req: Request) {
    return;
  }

  @Get('main')
  @Render('main')
  mainPage(@Req() req: Request) {
    const user = req.cookies['jwt-access'] ? true : false;

    return { user };
  }

  @Get('chat')
  @Render('chat')
  chatPage(@Req() req: Request) {
    return;
  }

  @Post('friend-request')
  async temp(@Req() req, @Body('friend_id') friendId) {
    let res;
    try {
      res = await fetch(`http://localhost/friend/request/${friendId}`, {
        headers: {
          authorization: req.cookies['jwt-access'],
        },
      });
    } catch (e) {
      return;
    }

    return await res.json();
  }

  @Get('login/:provider')
  async oauthResult(
    @Param('provider') provider,
    @Query('code') code,
    @Res() res: Response,
  ) {
    const gwRes = await this.authService.signIn(provider, code);
    //BUG: NO ACCESS TOKEN AND PROVIDER IF UNAUTHORIZED FROM PROVIDER
    //프로바이더에 이미 로그인을 한 상태에서, 새로고침 등을 하는거면 (우리 사이트 쿠키는 지우고), 그럼 아까 code를 재사용해서 unauthorized가 뜨는건지, 찍어봐야함
    if (gwRes && !gwRes.access_token) {
      console.log('FRONTEND: NO ACCESS_TOKEN!');
      res.redirect(
        `/auth/signup_view?provider=${gwRes.provider}&third_party_id=${gwRes.third_party_id}&prof_img=${gwRes.prof_img}`,
      );
    } else {
      console.log('FRONTEND: GOT ACCESS TOKEN!');
      const { access_token, refresh_token } = gwRes;
      res.cookie('jwt-access', access_token);
      res.cookie('jwt-refresh', refresh_token);
      res.redirect('/main');
    }
  }
}
