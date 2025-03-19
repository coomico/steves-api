import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { EventModule } from './event/event.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrantModule } from './registrant/registrant.module';
import { DivisionModule } from './division/division.module';
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
import { Registrant } from './registrant/registrant.entity';
import { Division } from './division/division.entity';
import { Link } from './link/link.entity';
import {
  EventAttachment,
  RegistrantAttachment,
} from './attachment/attachment.entity';
import { SelectedDivision } from './selected_division/selected_division.entity';
import {
  Interview,
  InterviewBlocking,
  InterviewSchedule,
} from './interview/interview.entity';
import { RefreshToken } from './auth/auth.entity';

@Module({
  imports: [
    UserModule,
    EventModule,
    RegistrantModule,
    DivisionModule,
    LinkModule,
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
        Registrant,
        Division,
        Link,
        EventAttachment,
        RegistrantAttachment,
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
