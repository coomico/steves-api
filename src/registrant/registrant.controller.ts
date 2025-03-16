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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RegistrantService } from './registrant.service';
import { NewRegistrantDTO, UpdateRegistrantDTO } from 'src/common/dtos';
import { AccessAuthGuard } from 'src/auth/guard/access.guard';
import {
  MAX_NUMBER_ATTACHMENTS,
  OrderOptions,
  RequestWithClaims,
  StatusOptions,
} from 'src/common/utils';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AttachmentService } from 'src/attachment/attachment.service';
import { FileValidationService } from 'src/file_validation/file_validation.service';
import { RegistrantAttachmentValidation } from 'src/common/pipe/attachment-validation.pipe';
import { OrderParsePipe } from 'src/common/pipe/order-parse.pipe';
import { StatusParsePipe } from 'src/common/pipe/status-parse.pipe';
import { RegistrantStatus } from 'src/common/enums';
import { RegistrantAttachment } from 'src/attachment/attachment.entity';

@Controller('registrants')
@UseInterceptors(ClassSerializerInterceptor)
export class RegistrantController {
  constructor(
    private registrantService: RegistrantService,
    private attachmentService: AttachmentService,
  ) {}

  @Get(':id')
  @UseGuards(AccessAuthGuard)
  async fetchById(
    @Req() req: RequestWithClaims,
    @Param('id') registrantId: number,
  ) {
    const registrant = await this.registrantService.findOne(
      [
        {
          id: registrantId,
          user: { id: req.user.id },
        },
        {
          id: registrantId,
          event: {
            author: { id: req.user.id },
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

    if (registrant.user.id === req.user.id) {
      const { user, deleted_at, ...rest } = registrant;
      return rest;
    }

    const { event, deleted_at, ...rest } = registrant;
    return rest;
  }

  @Get()
  @UseGuards(AccessAuthGuard)
  fetchAll(
    @Req() req: RequestWithClaims,
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
      new StatusParsePipe(RegistrantStatus),
    )
    status?: StatusOptions<RegistrantStatus>[],
  ) {
    return this.registrantService.findAll(
      eventId,
      take,
      skip,
      req.user.id,
      order,
      status,
      true,
    );
  }

  @Post()
  @UseGuards(AccessAuthGuard)
  regist(@Req() req: RequestWithClaims, @Body() data: NewRegistrantDTO) {
    return this.registrantService.create(data, req.user.id);
  }

  @Get(':id/attachments')
  @UseGuards(AccessAuthGuard)
  getAttachments(@Param('id') registrantId: number) {
    return this.attachmentService.showAll<RegistrantAttachment>(
      'registrant',
      {
        registrant: { id: registrantId },
      },
      true,
    );
  }

  @Post(':id/attachments')
  @UseGuards(AccessAuthGuard)
  @UseInterceptors(FilesInterceptor('attachments', MAX_NUMBER_ATTACHMENTS))
  uploadAttachments(
    @Req() req: RequestWithClaims,
    @Param('id') registrantId: number,
    @UploadedFiles(
      new RegistrantAttachmentValidation(new FileValidationService()),
    )
    files?: Express.Multer.File[],
  ) {
    return this.registrantService.addAttachments(
      registrantId,
      req.user.id,
      files,
    );
  }

  @Delete(':rid/attachments/:aid')
  @UseGuards(AccessAuthGuard)
  removeAttachment(
    @Req() req: RequestWithClaims,
    @Param('rid') registrantId: number,
    @Param('aid') attachmentId: number,
  ) {
    return this.attachmentService.removeAttachment(
      attachmentId,
      'registrant',
      registrantId,
      req.user.id,
    );
  }

  @Put(':id')
  @UseGuards(AccessAuthGuard)
  update(
    @Req() req: RequestWithClaims,
    @Param('id') registrantId: number,
    @Body() data: UpdateRegistrantDTO,
  ) {
    return this.registrantService.update(data, registrantId, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AccessAuthGuard)
  remove(@Req() req: RequestWithClaims, @Param('id') registrantId: number) {
    return this.registrantService.remove(registrantId, req.user.id);
  }
}
