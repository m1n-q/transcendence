import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class Oauth42Guard extends AuthGuard('oauth2-42') {}

// @Injectable()
// export class OauthGoogleGuard extends AuthGuard('oauth2-google') {}

// @Injectable()
// export class OauthKakaoGuard extends AuthGuard('oauth2-kakao') {}
