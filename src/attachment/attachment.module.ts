import { Module } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventAttachment, RegistrantAttachment } from './attachment.entity';
import { AttachmentController } from './attachment.controller';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [
    StorageModule,
    TypeOrmModule.forFeature([EventAttachment, RegistrantAttachment]),
  ],
  exports: [AttachmentService],
  providers: [AttachmentService],
  controllers: [AttachmentController],
})
export class AttachmentModule {}
