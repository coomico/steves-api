import { Module } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventAttachment, ApplicationAttachment } from './attachment.entity';
import { AttachmentController } from './attachment.controller';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [
    StorageModule,
    TypeOrmModule.forFeature([EventAttachment, ApplicationAttachment]),
  ],
  exports: [AttachmentService],
  providers: [AttachmentService],
  controllers: [AttachmentController],
})
export class AttachmentModule {}
