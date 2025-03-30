import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UserDTO, UserInfo } from 'src/common/dtos';
import { AuthService } from './auth.service';
import { GoogleOauthGuard } from './guard/google-oauth.guard';
import { RefreshAuthGuard } from './guard/refresh.guard';
import { REFRESH_EXPIRED, REFRESH_NAME } from 'src/common/utils';
import { ApiCookieAuth } from '@nestjs/swagger';
import { User } from 'src/common/decorator/user.decorator';
import { ResponseTransformInterceptor } from 'src/common/interceptor/response.interceptor';

@Controller('auth')
@UseInterceptors(new ResponseTransformInterceptor())
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

    return res.redirect(
      `${process.env.FRONTEND_CALLBACK_URL}?access_token=${tokens[0]}`,
    );
  }

  @Get('refresh')
  @UseGuards(RefreshAuthGuard)
  @ApiCookieAuth('refreshToken')
  async refresh(@User('id') userId: number) {
    return {
      access_token: await this.authService.refreshAccess(userId),
    };
  }

  @Post('logout')
  @UseGuards(RefreshAuthGuard)
  @ApiCookieAuth('refreshToken')
  logout(@User() user: UserInfo, @Res() res: Response) {
    this.authService.logout(user);

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
  logoutAll(@User() user: UserInfo, @Res() res: Response) {
    this.authService.logoutAll(user);

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
