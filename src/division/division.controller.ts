import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DivisionService } from './division.service';
import { DivisionDTO, UpdateDivisionDTO } from 'src/common/dtos';
import { ApiBody } from '@nestjs/swagger';
import { AccessAuthGuard } from 'src/auth/guard/access.guard';
import { RequestWithClaims } from 'src/common/utils';

@Controller('divisions')
@UseInterceptors(ClassSerializerInterceptor)
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
    @Req() req: RequestWithClaims,
    @Query('eventid', ParseIntPipe) eventId: number,
    @Body() data: DivisionDTO | DivisionDTO[],
  ) {
    return this.divisionService.create(data, eventId, req.user.id);
  }

  @Put(':id')
  @UseGuards(AccessAuthGuard)
  update(
    @Req() req: RequestWithClaims,
    @Param('id') divisionId: number,
    @Body() data: UpdateDivisionDTO,
  ) {
    return this.divisionService.update(data, divisionId, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AccessAuthGuard)
  remove(@Req() req: RequestWithClaims, @Param('id') divisionId: number) {
    return this.divisionService.remove(divisionId, req.user.id);
  }
}
