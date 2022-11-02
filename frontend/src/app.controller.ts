import {
  Body,
  Controller,
  Get,
  Post,
  Redirect,
  Render,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

@Controller()
export class AppController {
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
      res = await fetch(`http://localhost:3000/friend/request/${friendId}`, {
        headers: {
          authorization: req.cookies['jwt-access'],
        },
      });
    } catch (e) {
      return;
    }

    return await res.json();
  }
}
