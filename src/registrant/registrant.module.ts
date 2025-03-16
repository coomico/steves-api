import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registrant } from './registrant.entity';
import { RegistrantService } from './registrant.service';
import { EventModule } from 'src/event/event.module';
import { UserModule } from 'src/user/user.module';
import { RegistrantController } from './registrant.controller';
import { AttachmentModule } from 'src/attachment/attachment.module';
import { SelectedDivisionModule } from 'src/selected_division/selected_division.module';
import { StorageModule } from 'src/storage/storage.module';
import { RegistrantAttachment } from 'src/attachment/attachment.entity';

@Module({
  imports: [
    UserModule,
    EventModule,
    StorageModule,
    AttachmentModule,
    SelectedDivisionModule,
    TypeOrmModule.forFeature([Registrant, RegistrantAttachment]),
  ],
  exports: [RegistrantService],
  providers: [RegistrantService],
  controllers: [RegistrantController],
})
export class RegistrantModule {}
