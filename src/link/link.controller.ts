import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LinkService } from './link.service';
import { LinkDTO, UpdateLinkDTO } from 'src/common/dtos';
import { ApiBody } from '@nestjs/swagger';
import { AccessAuthGuard } from 'src/auth/guard/access.guard';
import { CACHE_TTL } from 'src/common/utils';
import { Response } from 'express';
import { User } from 'src/common/decorator/user.decorator';

@Controller('links')
@UseInterceptors(ClassSerializerInterceptor)
export class LinkController {
  constructor(private linkService: LinkService) {}

  @Get()
  showAll(@Param('eventid') eventId: number) {
    return this.linkService.findAll(eventId, true);
  }

  @Get(':id')
  @UseGuards(AccessAuthGuard)
  async accessLink(
    @User('id') userId: number,
    @Param('id') linkId: number,
    @Res() res: Response,
  ) {
    const link = await this.linkService.findById(linkId, userId, CACHE_TTL);
    return res.redirect(link.url);
  }

  @ApiBody({
    type: LinkDTO,
    isArray: true,
  })
  @Post()
  @UseGuards(AccessAuthGuard)
  create(
    @User('id') userId: number,
    @Query('eventid') eventId: number,
    @Body() data: LinkDTO | LinkDTO[],
  ) {
    return this.linkService.create(data, eventId, userId);
  }

  @Put(':id')
  @UseGuards(AccessAuthGuard)
  update(
    @User('id') userId: number,
    @Param('id') linkId: number,
    @Body() data: UpdateLinkDTO,
  ) {
    return this.linkService.update(data, linkId, userId);
  }

  @Delete(':id')
  @UseGuards(AccessAuthGuard)
  remove(@User('id') userId: number, @Param('id') linkId: number) {
    return this.linkService.remove(linkId, userId);
  }
}
