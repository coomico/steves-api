import { Module } from '@nestjs/common';
import { FaqService } from './faq.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Faq } from './faq.entity';
import { EventModule } from 'src/event/event.module';
import { FaqController } from './faq.controller';

@Module({
  imports: [EventModule, TypeOrmModule.forFeature([Faq])],
  providers: [FaqService],
  controllers: [FaqController],
})
export class FaqModule {}
