import { Injectable } from '@nestjs/common';
import { PassportStrategy, AbstractStrategy } from '@nestjs/passport';
import { Strategy as oStrategy } from 'passport-oauth2';
// import { Strategy as gStrategy } from 'passport-google-oauth20';
// import { Strategy as kStrategy } from 'passport-kakao';

//! TODO: refresh
// https://github.com/jaredhanson/passport-google-oauth/issues/23
// https://stackoverflow.com/questions/19598720/get-an-oauth-access-token-from-refresh-token-in-passportjs

@Injectable()
export class Oauth42Strategy extends PassportStrategy(oStrategy, 'oauth2-42') {
  constructor() {
    super({
      clientID: process.env.OAUTH2_42_ID,
      clientSecret: process.env.OAUTH2_42_SECRET,
      authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
      tokenURL: 'https://api.intra.42.fr/oauth/token',
      callbackURL: 'http://localhost/auth/oauth2/42/result',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, accessToken: string, refreshToken: string) {
    console.log({ accessToken, refreshToken });
    let res: Response;
    try {
      res = await fetch(`https://api.intra.42.fr/v2/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (e) {
      console.log('Oauth42Strategy#validate()', e);
    }

    // https://stackoverflow.com/questions/53511974/javascript-fetch-failed-to-execute-json-on-response-body-stream-is-locked
    const { id: third_party_id, image_url: prof_img } = await res.json();
    return { provider: '42', third_party_id, prof_img };
  }
}

// @Injectable()
// export class OauthGoogleStrategy extends PassportStrategy(
//   gStrategy,
//   'oauth2-google',
// ) {
//   constructor() {
//     super({
//       clientID: process.env.OAUTH2_GOOGLE_ID,
//       clientSecret: process.env.OAUTH2_GOOGLE_SECRET,
//       authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
//       tokenURL: 'https://accounts.google.com/o/oauth2/token',
//       callbackURL: 'http://localhost/auth/oauth2/google/result',
//       scope: ['https://www.googleapis.com/auth/userinfo.profile'],
//     });
//   }

//   async validate(accessToken: string, refreshToken: string, profile: any) {
//     const {
//       provider,
//       id: third_party_id,
//       _json: { picture: prof_img },
//     } = profile;
//     return { provider, third_party_id, prof_img };
//   }
// }

// @Injectable()
// export class OauthKakaoStrategy extends PassportStrategy(
//   kStrategy,
//   'oauth2-kakao',
// ) {
//   constructor() {
//     super({
//       clientID: process.env.OAUTH2_KAKAO_ID,
//       callbackURL: 'http://localhost/auth/oauth2/kakao/result',
//     });
//   }

//   async validate(accessToken: string, refreshToken: string, profile: any) {
//     const { provider, id: third_party_id, profile_image: prof_img } = profile;
//     return { provider, third_party_id, prof_img };
//   }
// }

// async function refresh(tokenURL, client_id, client_secret, refreshToken) {
//   const res = await fetch('https://api.intra.42.fr/oauth/token', {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${refreshToken}`,
//       'Content-type': 'application/json',
//     },
//     body: JSON.stringify({
//       grant_type: 'refresh_token',
//       client_id,
//       client_secret,
//       refresh_token: refreshToken,
//     }),
//   });
//   const { access_token, refresh_token } = await res.json();
//   return { accessToken: access_token, refreshToken: refresh_token };
// }
