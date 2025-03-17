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
  fetchById(@User('id') userId: number) {
    return this.userService.findById(
      userId,
      {
        events: true,
        registrants: true,
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
