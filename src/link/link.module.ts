import { Module } from '@nestjs/common';
import { LinkService } from './link.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Link } from './link.entity';
import { LinkController } from './link.controller';
import { EventModule } from 'src/event/event.module';

@Module({
  imports: [EventModule, TypeOrmModule.forFeature([Link])],
  providers: [LinkService],
  controllers: [LinkController],
})
export class LinkModule {}
