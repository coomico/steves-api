import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { getNIM } from 'src/common/utils';

@Injectable()
export class GoogleOauthStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, displayName, emails, photos } = profile;

    let nim = getNIM(emails[0].value);
    nim ??=
      process.env.NODE_ENV !== 'production'
        ? Math.floor(Math.random() * 4121239999).toString()
        : nim;

    if (!nim) {
      throw new BadRequestException('Email username does not contain NIM!');
    }

    const user = {
      provider: 'google',
      providerId: id,
      name: displayName,
      email: emails[0].value,
      nim,
      picture: photos[0].value,
    };

    done(null, user);
  }
}
