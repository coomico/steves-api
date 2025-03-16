import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { QueryFailedFilter } from './common/filter/queryfailed.filter';
import * as cookieParser from 'cookie-parser';
import { ResponseTransformInterceptor } from './common/interceptor/response.interceptor';
import { REFRESH_NAME } from './common/utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new QueryFailedFilter());

  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  const docConfig = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription("U'll know what u're reading here")
    .setVersion('0.0.1')
    .addCookieAuth(
      REFRESH_NAME,
      {
        type: 'apiKey',
        in: 'cookie',
        scheme: REFRESH_NAME,
      },
      'refreshToken',
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, docConfig);
  SwaggerModule.setup('docs', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.APP_PORT ?? 3000);
}

bootstrap();
