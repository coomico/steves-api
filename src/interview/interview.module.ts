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
import { ApplicationModule } from 'src/application/application.module';

@Module({
  imports: [
    EventModule,
    ApplicationModule,
    TypeOrmModule.forFeature([Interview, InterviewBlocking, InterviewSchedule]),
  ],
  exports: [InterviewService],
  providers: [InterviewService],
  controllers: [InterviewController],
})
export class InterviewModule {}
