import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { REFRESH_NAME } from 'src/common/utils';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => {
        if (!req || !req.cookies) return null;
        return req.cookies[REFRESH_NAME];
      },
      ignoreExpiration: false,
      secretOrKey: process.env.REFRESH_KEY as string,
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      token: payload.jti,
    };
  }
}
