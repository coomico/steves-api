import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { Event } from './event.entity';
import { EventController } from './event.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { StorageModule } from 'src/storage/storage.module';
import { EventAttachment } from 'src/attachment/attachment.entity';
import { AttachmentModule } from 'src/attachment/attachment.module';
import { PaginationModule } from 'src/pagination/pagination.module';
import { SocialAccountModule } from 'src/social_account/social_account.module';
import { EventSocialAccount } from 'src/social_account/social_account.entity';

@Module({
  imports: [
    UserModule,
    StorageModule,
    AttachmentModule,
    PaginationModule,
    SocialAccountModule,
    TypeOrmModule.forFeature([Event, EventAttachment, EventSocialAccount]),
  ],
  exports: [EventService],
  providers: [EventService, Event],
  controllers: [EventController],
})
export class EventModule {}
