import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  get42AuthCode() {
    const clientID = process.env.OAUTH2_42_ID;
    const redirectURI = process.env.OAUTH2_URI + '/42/result';

    return `https://api.intra.42.fr/oauth/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectURI}`;
  }

  getKakaoAuthCode() {
    const clientID = process.env.OAUTH2_KAKAO_ID;
    const redirectURI = process.env.OAUTH2_URI + '/kakao/result';
    //&scope=profile_image,profile_nickname
    return `https://kauth.kakao.com/oauth/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectURI}`;
  }
  getGoogleAuthCode() {
    const clientID = process.env.OAUTH2_GOOGLE_ID;
    const redirectURI = process.env.OAUTH2_URI + '/google/result';

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientID}&response_type=code&redirect_uri=${redirectURI}&scope=https://www.googleapis.com/auth/userinfo.profile`;
  }

  async signIn(provider: string, code: string) {
    console.log(code);
    const res = await fetch(`http://localhost:3000/auth/oauth2/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: code }),
    });
    const tokens = await res.json();
    return tokens;
  }

  async signUp(data) {
    const res = await fetch(`http://localhost:3000/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const a = await res.json();
    console.log(a);
    return a;
  }
}
