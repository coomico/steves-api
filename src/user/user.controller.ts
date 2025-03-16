import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Put,
  Req,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDTO } from 'src/common/dtos';
import { AccessAuthGuard } from 'src/auth/guard/access.guard';
import { RequestWithClaims } from 'src/common/utils';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  fetchAll() {
    return this.userService.findAll();
  }

  @Get('/me')
  @UseGuards(AccessAuthGuard)
  @SerializeOptions({ groups: ['user'] })
  fetchById(@Req() req: RequestWithClaims) {
    return this.userService.findById(
      req.user.id,
      {
        events: true,
        registrants: true,
      },
      true,
    );
  }

  @Put()
  @UseGuards(AccessAuthGuard)
  update(@Req() req: RequestWithClaims, @Body() data: UpdateUserDTO) {
    return this.userService.update(data, req.user.id);
  }
}
