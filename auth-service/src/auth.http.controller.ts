import {
  Controller,
  Get,
  InternalServerErrorException,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  Oauth42Guard,
  OauthGoogleGuard,
  OauthKakaoGuard,
} from './oauth2/oauth2.guard';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './jwt/jwt.guard';
import { UserInfoDto } from './dto/user-info.dto';
import { UserFinderService } from './user-finder/user-finder.service';

@Controller('auth')
export class AuthHttpController {
  constructor(
    private readonly authService: AuthService,
    private readonly userFinderService: UserFinderService,
  ) {}

  @UseGuards(Oauth42Guard)
  @Get('/oauth2/42/result')
  async oauth42Result(@Req() req) {
    let userInfo: UserInfoDto;
    try {
      userInfo = await this.userFinderService.findUserBy3pId(req.user);
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }

    if (!userInfo) return this.authService.signUp(req.user);
    return this.authService.signIn(userInfo);
  }

  @UseGuards(OauthGoogleGuard)
  @Get('/oauth2/google/result')
  async oauthGoogleResult(@Req() req) {
    let userInfo: UserInfoDto;
    try {
      userInfo = await this.userFinderService.findUserBy3pId(req.user);
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }

    if (!userInfo) return this.authService.signUp(req.user);
    return this.authService.signIn(userInfo);
  }

  @UseGuards(OauthKakaoGuard)
  @Get('/oauth2/kakao/result')
  async oauthKakaoResult(@Req() req) {
    let userInfo: UserInfoDto;
    try {
      userInfo = await this.userFinderService.findUserBy3pId(req.user);
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }

    if (!userInfo) return this.authService.signUp(req.user);
    return this.authService.signIn(userInfo);
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
