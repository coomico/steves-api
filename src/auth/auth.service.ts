import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDTO } from 'src/common/dtos';
import { UserService } from 'src/user/user.service';
import { LessThanOrEqual, Repository } from 'typeorm';
import { RefreshToken } from './auth.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { nanoid } from 'nanoid';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ACCESS_EXPIRED,
  REFRESH_EXPIRED,
  RequestWithClaims,
} from 'src/common/utils';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,

    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  private readonly logger = new Logger('Auth', {
    timestamp: true,
  });

  private async generateAccessToken(userId: number) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
      },
      {
        secret: process.env.ACCESS_KEY,
        expiresIn: ACCESS_EXPIRED,
      },
    );
  }

  private async generateRefreshToken(userId: number) {
    const token = nanoid();

    const jwt = await this.jwtService.signAsync(
      {
        sub: userId,
        jti: token,
      },
      {
        secret: process.env.REFRESH_KEY,
        expiresIn: REFRESH_EXPIRED,
      },
    );

    const expired = new Date();
    expired.setSeconds(expired.getSeconds() + REFRESH_EXPIRED);

    return { token, jwt, expired };
  }

  private async generateTokenPairs(userId: number) {
    return await Promise.all([
      this.generateAccessToken(userId),
      this.generateRefreshToken(userId),
    ]);
  }

  private async validateExistRefreshToken(userId: number, userToken: string) {
    const resToken = {
      valid: false,
      id: 0,
    };

    const [token] = await this.refreshTokenRepository.find({
      where: {
        user: {
          id: userId,
        },
        token: userToken,
      },
    });

    if (!token) return resToken;

    if (token.expires_in <= new Date()) {
      const deleteRes = await this.refreshTokenRepository.delete(token.id);
      this.logger.warn(
        `Delete ${deleteRes.affected} token: ${token.token} from user: ${token.user.id}`,
      );
      return resToken;
    }

    resToken.valid = true;
    resToken.id = token.id;

    return resToken;
  }

  async login(reqUser: UserDTO) {
    if (!reqUser) throw new BadRequestException('Unauthenticated');

    const user = await this.userService.findBy({ email: reqUser.email }, true);

    if (!user) return this.register(reqUser);

    const tokens = await this.generateTokenPairs(user.id);
    this.refreshTokenRepository.save({
      token: tokens[1].token,
      expires_in: tokens[1].expired,
      user,
    });

    return tokens;
  }

  async register(newUser: UserDTO) {
    const user = await this.userService.create(newUser);

    const tokens = await this.generateTokenPairs(user.id);
    this.refreshTokenRepository.save({
      token: tokens[1].token,
      expires_in: tokens[1].expired,
      user,
    });

    return tokens;
  }

  async refreshAccess(claims: RequestWithClaims) {
    return await this.generateAccessToken(claims.user.id);
  }

  async logout(claims: RequestWithClaims) {
    const token = await this.validateExistRefreshToken(
      claims.user.id,
      claims.user.token,
    );
    if (token.valid !== true)
      throw new UnauthorizedException('Missing or invalid token!');

    this.refreshTokenRepository
      .delete(token.id)
      .then((res) =>
        this.logger.warn(
          `Delete ${res.affected} token: ${claims.user.token} from user: ${claims.user.id}`,
        ),
      );

    return;
  }

  async logoutAll(claims: RequestWithClaims) {
    if (
      (await this.validateExistRefreshToken(claims.user.id, claims.user.token))
        .valid !== true
    )
      throw new UnauthorizedException('Missing or invalid token!');

    const { affected } = await this.refreshTokenRepository.delete({
      user: {
        id: claims.user.id,
      },
    });

    this.logger.warn(`Delete ${affected} tokens from user: ${claims.user.id}`);
    return;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async removeExpiredRefreshToken() {
    const { affected } = await this.refreshTokenRepository.delete({
      expires_in: LessThanOrEqual(new Date()),
    });

    this.logger.warn(`Delete ${affected} tokens that expired at ${new Date()}`);
    return;
  }
}
