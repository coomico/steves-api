import { Module } from '@nestjs/common';
import { DivisionService } from './division.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Division } from './division.entity';
import { DivisionController } from './division.controller';
import { EventModule } from 'src/event/event.module';

@Module({
  imports: [EventModule, TypeOrmModule.forFeature([Division])],
  exports: [DivisionService],
  providers: [DivisionService],
  controllers: [DivisionController],
})
export class DivisionModule {}
