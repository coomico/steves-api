import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { AccessAuthGuard } from 'src/auth/guard/access.guard';
import { RequestWithClaims } from 'src/common/utils';

@Controller('attachments')
export class AttachmentController {
  constructor(private attachmentService: AttachmentService) {}

  @Get('/:id')
  @UseGuards(AccessAuthGuard)
  async getAttachment(
    @Req() req: RequestWithClaims,
    @Param('id') attachmentId: number,
    @Query('entity') entity: 'event' | 'registrant',
  ) {
    const attachment = await this.attachmentService.findById(
      attachmentId,
      entity,
      req.user.id,
    );
    return new StreamableFile(attachment.buffer, {
      type: attachment.content_type,
      disposition: `attachment; filename="${attachment.original_filename}"`,
    });
  }
}
