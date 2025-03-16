import { Module } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Interview,
  InterviewBlocking,
  InterviewSchedule,
} from './interview.entity';
import { InterviewController } from './interview.controller';
import { EventModule } from 'src/event/event.module';
import { RegistrantModule } from 'src/registrant/registrant.module';

@Module({
  imports: [
    EventModule,
    RegistrantModule,
    TypeOrmModule.forFeature([Interview, InterviewBlocking, InterviewSchedule]),
  ],
  exports: [InterviewService],
  providers: [InterviewService],
  controllers: [InterviewController],
})
export class InterviewModule {}
