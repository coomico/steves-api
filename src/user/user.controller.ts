import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
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

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor, new ResponseTransformInterceptor())
export class UserController {
  constructor(private userService: UserService) {}

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
}
