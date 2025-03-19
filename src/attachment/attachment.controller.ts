import {
  Controller,
  Get,
  Param,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { AccessAuthGuard } from 'src/auth/guard/access.guard';
import { User } from 'src/common/decorator/user.decorator';

@Controller('attachments')
export class AttachmentController {
  constructor(private attachmentService: AttachmentService) {}

  @Get('/:id')
  @UseGuards(AccessAuthGuard)
  async getAttachment(
    @User('id') userId: number,
    @Param('id') attachmentId: number,
    @Query('entity') entity: 'event' | 'registrant',
  ) {
    const attachment = await this.attachmentService.findById(
      attachmentId,
      entity,
      userId,
    );
    return new StreamableFile(attachment.buffer, {
      type: attachment.content_type,
      disposition: `attachment; filename="${attachment.original_filename}"`,
    });
  }
}
