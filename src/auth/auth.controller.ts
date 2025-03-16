import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { UserDTO } from 'src/common/dtos';
import { AuthService } from './auth.service';
import { GoogleOauthGuard } from './guard/google-oauth.guard';
import { RefreshAuthGuard } from './guard/refresh.guard';
import {
  REFRESH_EXPIRED,
  REFRESH_NAME,
  RequestWithClaims,
} from 'src/common/utils';
import { ApiCookieAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleOauth() {}

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const tokens = await this.authService.login(req.user as UserDTO);

    res.cookie(REFRESH_NAME, tokens[1].jwt, {
      httpOnly: true,
      secure: true,
      path: '/auth',
      maxAge: REFRESH_EXPIRED * 1000,
      sameSite: 'none',
    });

    return res.redirect(`${process.env.FRONTEND_CALLBACK_URL}?access_token=${tokens[0]}`);
  }

  @Get('refresh')
  @UseGuards(RefreshAuthGuard)
  @ApiCookieAuth('refreshToken')
  async refresh(@Req() req: RequestWithClaims) {
    return {
      access_token: await this.authService.refreshAccess(req),
    };
  }

  @Post('logout')
  @UseGuards(RefreshAuthGuard)
  @ApiCookieAuth('refreshToken')
  async logout(@Req() req: RequestWithClaims, @Res() res: Response) {
    await this.authService.logout(req);

    res.cookie(REFRESH_NAME, '', {
      httpOnly: true,
      secure: true,
      maxAge: 10,
      path: '/auth',
      expires: new Date(1),
      sameSite: 'none',
    });

    return res.status(205).send();
  }

  @Post('logoutall')
  @UseGuards(RefreshAuthGuard)
  @ApiCookieAuth('refreshToken')
  async logoutAll(@Req() req: RequestWithClaims, @Res() res: Response) {
    await this.authService.logoutAll(req);

    res.cookie(REFRESH_NAME, '', {
      httpOnly: true,
      secure: true,
      maxAge: 10,
      path: '/auth',
      expires: new Date(1),
      sameSite: 'none',
    });

    return res.status(205).send();
  }
}
