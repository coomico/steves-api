import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  Post,
  Put,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDTO } from 'src/common/dtos';
import { AccessAuthGuard } from 'src/auth/guard/access.guard';
import { User } from 'src/common/decorator/user.decorator';
import { ResponseTransformInterceptor } from 'src/common/interceptor/response.interceptor';
import {
  SocialAccountDTO,
  UpdateSocialAccountDTO,
} from 'src/common/dtos/social_account.dto';
import { SocialAccountService } from 'src/social_account/social_account.service';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor, new ResponseTransformInterceptor())
export class UserController {
  constructor(
    private userService: UserService,
    private socialAccountService: SocialAccountService,
  ) {}

  @Get()
  fetchAll() {
    return this.userService.findAll();
  }

  @Get('/me')
  @UseGuards(AccessAuthGuard)
  @SerializeOptions({ groups: ['user'] })
  fetchById(@User('id') userId: number) {
    return this.userService.findById(
      userId,
      {
        events: true,
        applications: true,
      },
      true,
    );
  }

  @Put()
  @UseGuards(AccessAuthGuard)
  update(@User('id') userId: number, @Body() data: UpdateUserDTO) {
    return this.userService.update(data, userId);
  }

  @Post('social-accounts')
  @UseGuards(AccessAuthGuard)
  addSocialAccounts(
    @User('id') userId: number,
    @Body(new ParseArrayPipe({ items: SocialAccountDTO }))
    data: SocialAccountDTO[],
  ) {
    return this.userService.addSocialAccounts(data, userId);
  }

  @Put('social-accounts/:id')
  @UseGuards(AccessAuthGuard)
  updateSocialAccount(
    @User('id') userId: number,
    @Param('id') socialAccountId: number,
    @Body() data: UpdateSocialAccountDTO,
  ) {
    return this.socialAccountService.update(
      data,
      socialAccountId,
      'user',
      userId,
      undefined,
    );
  }

  @Delete('social-accounts/:id')
  @UseGuards(AccessAuthGuard)
  deleteSocialAccount(
    @User('id') userId: number,
    @Param('id') socialAccountId: number,
  ) {
    return this.socialAccountService.delete(
      socialAccountId,
      'user',
      userId,
      undefined,
    );
  }
}
