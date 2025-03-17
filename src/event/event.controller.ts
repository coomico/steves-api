import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  SerializeOptions,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDTO, UpdateEventDTO } from 'src/common/dtos';
import { AccessAuthGuard } from 'src/auth/guard/access.guard';
import {
  CategoryOptions,
  Cursor,
  MAX_NUMBER_ATTACHMENTS,
  OrderOptions,
  StatusOptions,
} from 'src/common/utils';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AttachmentService } from 'src/attachment/attachment.service';
import {
  EventAttachmentType,
  EventCategory,
  EventStatus,
} from 'src/common/enums';
import { OrderParsePipe } from 'src/common/pipe/order-parse.pipe';
import { CategoryParsePipe } from 'src/common/pipe/category-parse.pipe';
import { StatusParsePipe } from 'src/common/pipe/status-parse.pipe';
import { CursorExtractionPipe } from 'src/common/pipe/cursor-extraction.pipe';
import { FileValidationService } from 'src/file_validation/file_validation.service';
import {
  EventAttachmentValidation,
  LogoBannerValidation,
} from 'src/common/pipe/attachment-validation.pipe';
import { User } from 'src/common/decorator/user.decorator';

@Controller('events')
@UseInterceptors(ClassSerializerInterceptor)
export class EventController {
  constructor(
    private eventService: EventService,
    private attachmentService: AttachmentService,
  ) {}

  @Get()
  fetchAll(
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
    @Query('title') title?: string,
    @Query(
      'order',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
      new OrderParsePipe(),
    )
    order?: OrderOptions<string>,
    @Query(
      'category',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
      new CategoryParsePipe(EventCategory),
    )
    category?: CategoryOptions<EventCategory>[],
    @Query(
      'status',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
      new StatusParsePipe(EventStatus, [EventStatus.DRAFT]),
    )
    status?: StatusOptions<EventStatus, EventStatus.DRAFT>[],
    @Query('cursor', new CursorExtractionPipe()) cursor?: Cursor,
  ) {
    return this.eventService.findAll(
      take,
      undefined,
      title,
      order,
      category,
      status,
      cursor,
      true,
    );
  }

  @Get('owned')
  @UseGuards(AccessAuthGuard)
  fetchAllOwned(
    @User('id') userId: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
    @Query('title') title?: string,
    @Query(
      'order',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
      new OrderParsePipe(),
    )
    order?: OrderOptions<string>,
    @Query(
      'category',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
      new CategoryParsePipe(EventCategory),
    )
    category?: CategoryOptions<EventCategory>[],
    @Query(
      'status',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
      new StatusParsePipe(EventStatus, [EventStatus.DRAFT]),
    )
    status?: StatusOptions<EventStatus, EventStatus.DRAFT>[],
    @Query('cursor', new CursorExtractionPipe()) cursor?: Cursor,
  ) {
    return this.eventService.findAll(
      take,
      userId,
      title,
      order,
      category,
      status,
      cursor,
      true,
    );
  }

  @Get(':id')
  @SerializeOptions({ groups: ['event'] })
  fetchById(@Param('id') id: number) {
    return this.eventService.findById(
      id,
      {
        author: true,
        interview: true,
      },
      undefined,
      undefined,
      true,
    );
  }

  @Post()
  @UseGuards(AccessAuthGuard)
  @SerializeOptions({ groups: ['event'] })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  create(
    @User('id') userId: number,
    @UploadedFiles(new LogoBannerValidation(new FileValidationService()))
    files: {
      logo?: Express.Multer.File;
      banner?: Express.Multer.File;
    },
    @Body() data: CreateEventDTO,
  ) {
    return this.eventService.create(data, userId, files);
  }

  @Put(':id')
  @UseGuards(AccessAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  update(
    @User('id') userId: number,
    @Param('id') eventId: number,
    @Body() data: UpdateEventDTO,
    @UploadedFiles(new LogoBannerValidation(new FileValidationService()))
    files: {
      logo?: Express.Multer.File;
      banner?: Express.Multer.File;
    },
  ) {
    return this.eventService.update(data, eventId, userId, files);
  }

  @Get(':id/attachments')
  fetchAttachmentsProperties(@Param('id') eventId: number) {
    return this.attachmentService.showAll(
      'event',
      {
        event: { id: eventId },
        type: EventAttachmentType.OTHER,
      },
      true,
    );
  }

  @Post(':id/attachments')
  @UseGuards(AccessAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'public_attachments', maxCount: MAX_NUMBER_ATTACHMENTS },
      { name: 'private_attachments', maxCount: MAX_NUMBER_ATTACHMENTS },
    ]),
  )
  uploadAttachments(
    @User('id') userId: number,
    @Param('id') eventId: number,
    @UploadedFiles(new EventAttachmentValidation(new FileValidationService()))
    files: {
      public_attachments?: Express.Multer.File[];
      private_attachments?: Express.Multer.File[];
    },
  ) {
    return this.eventService.addAttachments(eventId, files, userId);
  }

  @Delete(':eid/attachments/:aid')
  @UseGuards(AccessAuthGuard)
  removeAttachment(
    @User('id') userId: number,
    @Param('eid') eventId: number,
    @Param('aid') attachmentId: number,
  ) {
    return this.attachmentService.removeAttachment(
      attachmentId,
      'event',
      eventId,
      userId,
    );
  }

  @Delete(':id')
  @UseGuards(AccessAuthGuard)
  remove(@User('id') userId: number, @Param('id') eventId: number) {
    return this.eventService.remove(eventId, userId);
  }
}
