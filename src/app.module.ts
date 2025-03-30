import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { EventModule } from './event/event.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DivisionModule } from './division/division.module';
import { FaqModule } from './faq/faq.module';
import { LinkModule } from './link/link.module';
import { AttachmentModule } from './attachment/attachment.module';
import { SelectedDivisionModule } from './selected_division/selected_division.module';
import { InterviewModule } from './interview/interview.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { StorageModule } from './storage/storage.module';
import { PaginationModule } from './pagination/pagination.module';
import { FileValidationModule } from './file_validation/file_validation.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { User } from './user/user.entity';
import { Event } from './event/event.entity';
import { Division } from './division/division.entity';
import { Link } from './link/link.entity';
import {
  ApplicationAttachment,
  EventAttachment,
} from './attachment/attachment.entity';
import { SelectedDivision } from './selected_division/selected_division.entity';
import {
  Interview,
  InterviewBlocking,
  InterviewSchedule,
} from './interview/interview.entity';
import { RefreshToken } from './auth/auth.entity';
import { Faq } from './faq/faq.entity';
import { ApplicationModule } from './application/application.module';
import { Application } from './application/application.entity';

@Module({
  imports: [
    UserModule,
    EventModule,
    DivisionModule,
    FaqModule,
    LinkModule,
    ApplicationModule,
    AttachmentModule,
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT as string) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [
        User,
        Event,
        Application,
        Division,
        Faq,
        Link,
        EventAttachment,
        ApplicationAttachment,
        SelectedDivision,
        Interview,
        InterviewBlocking,
        InterviewSchedule,
        RefreshToken,
      ],
      synchronize: process.env.NODE_ENV === 'production' ? false : true,
      logging: process.env.NODE_ENV === 'production' ? ['error'] : true,
    }),
    SelectedDivisionModule,
    InterviewModule,
    AuthModule,
    StorageModule,
    PaginationModule,
    FileValidationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
