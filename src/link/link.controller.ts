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
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LinkService } from './link.service';
import { LinkDTO, UpdateLinkDTO } from 'src/common/dtos';
import { ApiBody } from '@nestjs/swagger';
import { AccessAuthGuard } from 'src/auth/guard/access.guard';
import { CACHE_TTL, RequestWithClaims } from 'src/common/utils';
import { Response } from 'express';

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
    @Req() req: RequestWithClaims,
    @Param('id') linkId: number,
    @Res() res: Response,
  ) {
    const link = await this.linkService.findById(
      linkId,
      req.user.id,
      CACHE_TTL,
    );
    return res.redirect(link.url);
  }

  @ApiBody({
    type: LinkDTO,
    isArray: true,
  })
  @Post()
  @UseGuards(AccessAuthGuard)
  create(
    @Req() req: RequestWithClaims,
    @Query('eventid') eventId: number,
    @Body() data: LinkDTO | LinkDTO[],
  ) {
    return this.linkService.create(data, eventId, req.user.id);
  }

  @Put(':id')
  @UseGuards(AccessAuthGuard)
  update(
    @Req() req: RequestWithClaims,
    @Param('id') linkId: number,
    @Body() data: UpdateLinkDTO,
  ) {
    return this.linkService.update(data, linkId, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AccessAuthGuard)
  remove(@Req() req: RequestWithClaims, @Param('id') linkId: number) {
    return this.linkService.remove(linkId, req.user.id);
  }
}
