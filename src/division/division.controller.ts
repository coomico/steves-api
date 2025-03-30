import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DivisionService } from './division.service';
import { DivisionDTO, UpdateDivisionDTO } from 'src/common/dtos';
import { ApiBody } from '@nestjs/swagger';
import { AccessAuthGuard } from 'src/auth/guard/access.guard';
import { User } from 'src/common/decorator/user.decorator';
import { ResponseTransformInterceptor } from 'src/common/interceptor/response.interceptor';

@Controller('divisions')
@UseInterceptors(ClassSerializerInterceptor, new ResponseTransformInterceptor())
export class DivisionController {
  constructor(private divisionService: DivisionService) {}

  @Get()
  @SerializeOptions({ groups: ['division'] })
  fetchAll(@Query('eventid', ParseIntPipe) eventId: number) {
    return this.divisionService.findBy(
      {
        event: { id: eventId },
      },
      {
        selected_divisions: true,
      },
      true,
    );
  }

  @ApiBody({
    type: DivisionDTO,
    isArray: true,
  })
  @Post()
  @UseGuards(AccessAuthGuard)
  @SerializeOptions({ groups: ['division'] })
  create(
    @User('id') userId: number,
    @Query('eventid', ParseIntPipe) eventId: number,
    @Body(new ParseArrayPipe({ items: DivisionDTO })) data: DivisionDTO[],
  ) {
    return this.divisionService.create(data, eventId, userId);
  }

  @Put(':id')
  @UseGuards(AccessAuthGuard)
  update(
    @User('id') userId: number,
    @Param('id') divisionId: number,
    @Body() data: UpdateDivisionDTO,
  ) {
    return this.divisionService.update(data, divisionId, userId);
  }

  @Delete(':id')
  @UseGuards(AccessAuthGuard)
  remove(@User('id') userId: number, @Param('id') divisionId: number) {
    return this.divisionService.remove(divisionId, userId);
  }
}
