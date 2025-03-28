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
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FaqService } from './faq.service';
import { AccessAuthGuard } from 'src/auth/guard/access.guard';
import { User } from 'src/common/decorator/user.decorator';
import { FaqDTO, UpdateFaqDTO } from 'src/common/dtos';

@Controller('faqs')
@UseInterceptors(ClassSerializerInterceptor)
export class FaqController {
  constructor(private faqService: FaqService) {}

  @Get()
  showAll(@Query('eventid') eventId: number) {
    return this.faqService.findAll(eventId, true);
  }

  @Post()
  @UseGuards(AccessAuthGuard)
  create(
    @User('id') userId: number,
    @Query('eventid') eventId: number,
    @Body(new ParseArrayPipe({ items: FaqDTO })) data: FaqDTO[],
  ) {
    return this.faqService.create(data, eventId, userId);
  }

  @Put(':id')
  @UseGuards(AccessAuthGuard)
  update(
    @User('id') userId: number,
    @Param('id') faqId: number,
    @Body() data: UpdateFaqDTO,
  ) {
    return this.faqService.update(data, faqId, userId);
  }

  @Delete(':id')
  @UseGuards(AccessAuthGuard)
  remove(@User('id') userId: number, @Param('id') faqId: number) {
    return this.faqService.remove(faqId, userId);
  }
}
