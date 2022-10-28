import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  Render,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  Oauth42Guard,
  OauthGoogleGuard,
  OauthKakaoGuard,
} from '../../oauth2/oauth2.guard';
import { AuthService } from '../services/auth.service';
import { JwtRefreshGuard } from '../../jwt/jwt.guard';
import { UserService } from '../../user/services/user.service';

//@ ======================================================================== @//
//@
//@    If RmqError occured internally, (for example: 408 for Rmq Request Timeout)
//@    HTTP response will be 500: Internal Server Error,
//@    and 'code' specified in JSON indicates RmqError code.
//@
//@ ======================================================================== @//
let db;

@Controller('auth')
export class AuthHttpController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('show')
  show(@Body() body) {
    console.log(body);
    if (!db) db = body;
    return db;
  }
  //XXX: MOCK
  @Get('signup_view')
  @Render('index')
  signUpView(
    @Query('provider') provider,
    @Query('thirdPartyId') thirdPartyId,
    @Query('profImg') profImg,
  ) {
    return { provider, thirdPartyId, profImg };
  }

  @Post('signup')
  async signUp(@Body() body) {
    // body['2FA'] = body['2FA'] ? true : false;
    return this.userService.createUser(body);
  }

  @UseGuards(Oauth42Guard)
  @Get('/oauth2/42/result')
  async oauth42Result(@Req() req, @Res() res) {
    let tokens;
    const { provider, thirdPartyId, profImg } = req.user;

    try {
      tokens = await this.authService.signInIfExists({
        provider,
        thirdPartyId,
      });
    } catch (e) {
      if (e instanceof NotFoundException)
        /* FIXIT: return signup message to gateway or frontend */
        res.redirect(
          `/auth/signup_view?provider=${provider}&thirdPartyId=${thirdPartyId}&profImg=${profImg}`,
        );
      throw e;
    }
    res.send(tokens);
  }

  @UseGuards(OauthGoogleGuard)
  @Get('/oauth2/google/result')
  async oauthGoogleResult(@Req() req, @Res() res) {
    let tokens;
    const { provider, thirdPartyId, profImg } = req.user;

    try {
      tokens = await this.authService.signInIfExists({
        provider,
        thirdPartyId,
      });
    } catch (e) {
      if (e instanceof NotFoundException)
        /* FIXIT: return signup message to gateway or frontend */
        res.redirect(
          `/auth/signup_view?provider=${provider}&thirdPartyId=${thirdPartyId}&profImg=${profImg}`,
        );
      throw e;
    }
    res.send(tokens);
  }

  @UseGuards(OauthKakaoGuard)
  @Get('/oauth2/kakao/result')
  async oauthKakaoResult(@Req() req, @Res() res) {
    let tokens;
    const { provider, thirdPartyId, profImg } = req.user;

    try {
      tokens = await this.authService.signInIfExists({
        provider,
        thirdPartyId,
      });
    } catch (e) {
      if (e instanceof NotFoundException)
        /* FIXIT: return signup message to gateway or frontend */
        res.redirect(
          `/auth/signup_view?provider=${provider}&thirdPartyId=${thirdPartyId}&profImg=${profImg}`,
        );
      throw e;
    }
    res.send(tokens);
  }

  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  async refresh(@Req() req) {
    return this.authService.refresh(req.user.userInfo, req.user.refreshToken);
  }

  @UseGuards(Oauth42Guard)
  @Get('/oauth2/42')
  oauth42(): void {
    return;
  }
  @UseGuards(OauthGoogleGuard)
  @Get('/oauth2/google')
  oauthGoogle(): void {
    return;
  }
  @UseGuards(OauthKakaoGuard)
  @Get('/oauth2/kakao')
  oauthKakao(): void {
    return;
  }
}
