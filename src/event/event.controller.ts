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
  Req,
  SerializeOptions,
  UploadedFile,
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
  RequestWithClaims,
  StatusOptions,
} from 'src/common/utils';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AttachmentService } from 'src/attachment/attachment.service';
import { EventCategory, EventStatus } from 'src/common/enums';
import { OrderParsePipe } from 'src/common/pipe/order-parse.pipe';
import { CategoryParsePipe } from 'src/common/pipe/category-parse.pipe';
import { StatusParsePipe } from 'src/common/pipe/status-parse.pipe';
import { CursorExtractionPipe } from 'src/common/pipe/cursor-extraction.pipe';
import { FileValidationService } from 'src/file_validation/file_validation.service';
import {
  EventAttachmentValidation,
  LogoBannerValidation,
} from 'src/common/pipe/attachment-validation.pipe';

@Controller('events')
@UseInterceptors(ClassSerializerInterceptor)
export class EventController {
  constructor(
    private eventService: EventService,
    private attachmentService: AttachmentService,
  ) {}

  @Get()
  async fetchAll(
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
    return await this.eventService.findAll(
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
  async fetchAllOwned(
    @Req() req: RequestWithClaims,
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
    return await this.eventService.findAll(
      take,
      req.user.id,
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
  async create(
    @Req() req: RequestWithClaims,
    @UploadedFile(new LogoBannerValidation(new FileValidationService()))
    fields: {
      logo?: Express.Multer.File;
      banner?: Express.Multer.File;
    },
    @Body() data: CreateEventDTO,
  ) {
    return await this.eventService.create(data, req.user.id, fields);
  }

  @Put(':id')
  @UseGuards(AccessAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  async update(
    @Req() req: RequestWithClaims,
    @Param('id') eventId: number,
    @Body() data: UpdateEventDTO,
    @UploadedFile(new LogoBannerValidation(new FileValidationService()))
    files: {
      logo?: Express.Multer.File;
      banner?: Express.Multer.File;
    },
  ) {
    return await this.eventService.update(data, eventId, req.user.id, files);
  }

  @Get(':id/attachments')
  fetchAttachmentsProperties(@Param('id') eventId: number) {
    return this.attachmentService.showAll(
      'event',
      {
        event: { id: eventId },
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
    @Req() req: RequestWithClaims,
    @Param('id') eventId: number,
    @UploadedFiles(new EventAttachmentValidation(new FileValidationService()))
    files: {
      public_attachments?: Express.Multer.File[];
      private_attachments?: Express.Multer.File[];
    },
  ) {
    return this.eventService.addAttachments(eventId, files, req.user.id);
  }

  @Delete(':eid/attachments/:aid')
  @UseGuards(AccessAuthGuard)
  removeAttachment(
    @Req() req: RequestWithClaims,
    @Param('eid') eventId: number,
    @Param('aid') attachmentId: number,
  ) {
    return this.attachmentService.removeAttachment(
      attachmentId,
      'event',
      eventId,
      req.user.id,
    );
  }

  @Delete(':id')
  @UseGuards(AccessAuthGuard)
  remove(@Req() req: RequestWithClaims, @Param('id') eventId: number) {
    return this.eventService.remove(eventId, req.user.id);
  }
}
