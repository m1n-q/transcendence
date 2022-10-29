import { Controller, Get, Render, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller()
export class AppController {
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
