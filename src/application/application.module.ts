import { Module } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { UserModule } from 'src/user/user.module';
import { EventModule } from 'src/event/event.module';
import { StorageModule } from 'src/storage/storage.module';
import { AttachmentModule } from 'src/attachment/attachment.module';
import { SelectedDivisionModule } from 'src/selected_division/selected_division.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './application.entity';
import { ApplicationAttachment } from 'src/attachment/attachment.entity';

@Module({
  imports: [
    UserModule,
    EventModule,
    StorageModule,
    AttachmentModule,
    SelectedDivisionModule,
    TypeOrmModule.forFeature([Application, ApplicationAttachment]),
  ],
  exports: [ApplicationService],
  providers: [ApplicationService],
  controllers: [ApplicationController],
})
export class ApplicationModule {}
