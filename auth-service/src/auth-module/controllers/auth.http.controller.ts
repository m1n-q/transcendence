import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import { AuthService } from '../services/auth.service';
import { JwtRefreshGuard } from '../../jwt/jwt.guard';

//@ ======================================================================== @//
//@
//@    If RmqError occured internally, (for example: 408 for Rmq Request Timeout)
//@    HTTP response will be 500: Internal Server Error,
//@    and 'code' specified in JSON indicates RmqError code.
//@
//@ ======================================================================== @//

@Controller('auth')
export class AuthHttpController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  async refresh(@Req() req) {
    return this.authService.refresh(req.user.userInfo, req.user.refreshToken);
  }
}
