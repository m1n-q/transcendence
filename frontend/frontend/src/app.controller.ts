import { Controller, Get, Redirect, Render, Req } from '@nestjs/common';
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
}
