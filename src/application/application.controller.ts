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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { AttachmentService } from 'src/attachment/attachment.service';
import { AccessAuthGuard } from 'src/auth/guard/access.guard';
import { User } from 'src/common/decorator/user.decorator';
import { OrderParsePipe } from 'src/common/pipe/order-parse.pipe';
import {
  MAX_NUMBER_ATTACHMENTS,
  OrderOptions,
  StatusOptions,
} from 'src/common/utils';
import { StatusParsePipe } from 'src/common/pipe/status-parse.pipe';
import { ApplicationStatus } from 'src/common/enums/application-status.enum';
import {
  NewApplicationDTO,
  UpdateApplicationDTO,
} from 'src/common/dtos/application.dto';
import { ApplicationAttachment } from 'src/attachment/attachment.entity';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApplicationAttachmentValidation } from 'src/common/pipe/attachment-validation.pipe';
import { FileValidationService } from 'src/file_validation/file_validation.service';
import { ResponseTransformInterceptor } from 'src/common/interceptor/response.interceptor';

@Controller('applications')
@UseInterceptors(ClassSerializerInterceptor, new ResponseTransformInterceptor())
export class ApplicationController {
  constructor(
    private applicationService: ApplicationService,
    private attachmentService: AttachmentService,
  ) {}

  @Get(':id')
  @UseGuards(AccessAuthGuard)
  async fetchById(
    @User('id') userId: number,
    @Param('id') applicationId: number,
  ) {
    const application = await this.applicationService.findOne(
      [
        {
          id: applicationId,
          user: { id: userId },
        },
        {
          id: applicationId,
          event: {
            author: { id: userId },
          },
        },
      ],
      {
        user: true,
        event: true,
        selected_divisions: {
          division: true,
        },
      },
      {
        selected_divisions: {
          priority: 'ASC',
        },
      },
      true,
    );

    if (application.user.id === userId) {
      const { user, deleted_at, ...rest } = application;
      return rest;
    }

    const { event, deleted_at, ...rest } = application;
    return rest;
  }

  @Get()
  @UseGuards(AccessAuthGuard)
  fetchAll(
    @User('id') userId: number,
    @Query('eventid', ParseIntPipe) eventId: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query(
      'order',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
      new OrderParsePipe(),
    )
    order?: OrderOptions<string>,
    @Query(
      'status',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
      new StatusParsePipe(ApplicationStatus),
    )
    status?: StatusOptions<ApplicationStatus>[],
  ) {
    return this.applicationService.findAll(
      eventId,
      take,
      skip,
      userId,
      order,
      status,
      true,
    );
  }

  @Post()
  @UseGuards(AccessAuthGuard)
  apply(@User('id') userId: number, @Body() data: NewApplicationDTO) {
    return this.applicationService.create(data, userId);
  }

  @Get(':id/attachments')
  @UseGuards(AccessAuthGuard)
  getAttachments(@Param('id') applicationId: number) {
    return this.attachmentService.showAll<ApplicationAttachment>(
      'application',
      {
        application: { id: applicationId },
      },
      true,
    );
  }

  @Post(':id/attachments')
  @UseGuards(AccessAuthGuard)
  @UseInterceptors(FilesInterceptor('attachments', MAX_NUMBER_ATTACHMENTS))
  uploadAttachments(
    @User('id') userId: number,
    @Param('id') applicationId: number,
    @UploadedFiles(
      new ApplicationAttachmentValidation(new FileValidationService()),
    )
    files?: Express.Multer.File[],
  ) {
    return this.applicationService.addAttachments(applicationId, userId, files);
  }

  @Delete(':apid/attachments/:atid')
  @UseGuards(AccessAuthGuard)
  removeAttachment(
    @User('id') userId: number,
    @Param('apid') applicationId: number,
    @Param('atid') attachmentId: number,
  ) {
    return this.attachmentService.removeAttachment(
      attachmentId,
      'application',
      applicationId,
      userId,
    );
  }

  @Put(':id')
  @UseGuards(AccessAuthGuard)
  update(
    @User('id') userId: number,
    @Param('id') applicationId: number,
    @Body() data: UpdateApplicationDTO,
  ) {
    return this.applicationService.update(data, applicationId, userId);
  }

  @Delete(':id')
  @UseGuards(AccessAuthGuard)
  remove(@User('id') userId: number, @Param('id') applicationId: number) {
    return this.applicationService.remove(applicationId, userId);
  }
}
