import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserInfoDto } from '../dto/user-info.dto';
import { RmqService } from '../rmq/services/rmq.service';

const extractFromCookie = function (key: string) {
  return (req: Request) => {
    let token = null;
    if (req && req.cookies) token = req.cookies[key];
    return token;
  };
};

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(private readonly rmqService: RmqService) {
    super({
      jwtFromRequest: extractFromCookie('jwt-access'),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: UserInfoDto) {
    const matches: UserInfoDto = await this.rmqService.requestUserInfoById(
      payload.userId,
    );
    if (!matches)
      throw new UnauthorizedException('access_token validate failed');
    return payload;
  }
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private jwtExtractor: any;
  constructor() {
    super({
      jwtFromRequest: extractFromCookie('jwt-refresh'),
      // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    });

    this.jwtExtractor = extractFromCookie('jwt-refresh');
  }

  async validate(req: Request, payload: UserInfoDto) {
    const refreshToken = this.jwtExtractor(req);
    // const refreshToken = req.get('Authorization').replace('Bearer', '').trim();

    const matches: UserInfoDto = await this.rmqService.requestUserInfoById(
      payload.userId,
    );
    if (!matches)
      throw new UnauthorizedException('refresh_token validate failed');
    return { payload, refreshToken };
  }
}
