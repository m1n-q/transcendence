import { RmqError } from './../../common/rmq/types/rmq-error';
import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { UserService } from '../../user/services/user.service';
import { UserInfo } from 'src/user/types/user-info';

const WHERE = 'auth-service';

@Injectable()
export class TwoFactorAuthenticationService {
  constructor(private readonly userService: UserService) {}

  async generateTwoFactorAuthenticationSecret(userId: string) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      'google-Authenticator',
      'transcendence',
      secret,
    );
    return { otpauthUrl, secret };
  }

  async set2FA(userId: string, secret: string, code: string) {
    if (!this.isTwoFactorAuthenticationCodeValid(code, secret)) {
      throw new RmqError({
        code: 401,
        message: 'Unauthorized 2fa code',
        where: `${WHERE} #isTwoFactorAuthenticationCodeValid`,
      });
    }
    try {
      await this.userService.updateUser2FAByID({
        user_id: userId,
        type: 'google',
        key: secret,
      });
    } catch (e) {
      throw new RmqError({
        code: e.code,
        message: e.message,
        where: e.where,
      });
    }
    return;
  }

  updateTwoFactorAuthentication(
    twoFactorAuthenticationCode: string,
    user: UserInfo,
    is_two_factor_authentication_enable: boolean,
  ) {
    if (
      user.two_factor_authentication_key === null ||
      !this.isTwoFactorAuthenticationCodeValid(
        twoFactorAuthenticationCode,
        user.two_factor_authentication_key,
      )
    ) {
      throw new RmqError({
        code: 401,
        message: 'Unauthorized 2fa code',
        where: `${WHERE} #isTwoFactorAuthenticationCodeValid`,
      });
    }
    try {
      this.userService.updateUser2FAEnableByID({
        user_id: user.user_id,
        is_two_factor_authentication_enable,
      });
    } catch (e) {
      throw e;
    }
    return;
  }

  deleteTwoFactorAuthentication(
    twoFactorAuthenticationCode: string,
    user: UserInfo,
  ) {
    if (
      user.two_factor_authentication_key === null ||
      !this.isTwoFactorAuthenticationCodeValid(
        twoFactorAuthenticationCode,
        user.two_factor_authentication_key,
      )
    ) {
      throw new RmqError({
        code: 401,
        message: 'Unauthorized 2fa code',
        where: `${WHERE} #isTwoFactorAuthenticationCodeValid`,
      });
    }
    try {
      this.userService.deleteUser2FAByID({
        user_id: user.user_id,
      });
    } catch (e) {
      throw e;
    }
  }

  isTwoFactorAuthenticationCodeValid(
    twoFactorAuthenticationCode: string,
    twoFactorAuthenticationKey: string,
  ) {
    return authenticator.verify({
      token: twoFactorAuthenticationCode,
      secret: twoFactorAuthenticationKey,
    });
  }
}
